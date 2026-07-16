using System.Runtime.InteropServices;
using System.Text.Json;
using System.Drawing;
using System.Drawing.Drawing2D;
using Microsoft.Win32;

namespace Paraline.AudioBridge;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        WasapiLoopbackCapture? capture = null;
        DateTime lastWallpaperCheck = DateTime.MinValue;
        bool wasWallpaperPollingEnabled = false;

        WallpaperPollingControl.StartReading();

        while (true)
        {
            try
            {
                if (capture == null)
                {
                    capture = new WasapiLoopbackCapture();
                }

                var value = capture.ReadLevel();

                // Keep the stdout contract stable so Electron does not need to change.
                var payload = JsonSerializer.Serialize(new
                {
                    type = "level",
                    value
                });

                Console.WriteLine(payload);

                bool wallpaperPollingEnabled = WallpaperPollingControl.Enabled;
                if (!wallpaperPollingEnabled)
                {
                    lastWallpaperCheck = DateTime.MinValue;
                }
                // Check immediately when enabled, then every 5 seconds while enabled.
                else if (!wasWallpaperPollingEnabled || (DateTime.Now - lastWallpaperCheck).TotalSeconds >= 5)
                {
                    lastWallpaperCheck = DateTime.Now;
                    var colors = WallpaperColorExtractor.GetWallpaperColors();
                    if (colors != null && WallpaperPollingControl.Enabled)
                    {
                        var colorsPayload = JsonSerializer.Serialize(new
                        {
                            type = "colors",
                            value = colors
                        });
                        Console.WriteLine(colorsPayload);
                    }
                }
                wasWallpaperPollingEnabled = wallpaperPollingEnabled;

                Thread.Sleep(33);
            }
            catch (Exception ex)
            {
                // Log the exception to stderr for diagnostics
                Console.Error.WriteLine($"[AudioBridge] Capture encountered an exception: {ex.Message}. Re-initializing stream...");

                // Dispose of the stale capture client cleanly
                if (capture != null)
                {
                    try
                    {
                        capture.Dispose();
                    }
                    catch
                    {
                        // Ignore disposal errors of invalidated streams
                    }
                    capture = null;
                }

                // Wait 1 second before attempting to bind to the new default audio endpoint
                Thread.Sleep(1000);
            }
        }
    }
}

internal static class WallpaperPollingControl
{
    private static int _enabled;

    internal static bool Enabled => Volatile.Read(ref _enabled) == 1;

    internal static void StartReading()
    {
        _ = Task.Run(ReadCommands);
    }

    private static void ReadCommands()
    {
        string? line;
        while ((line = Console.ReadLine()) != null)
        {
            TryApplyCommand(line);
        }
    }

    internal static bool TryApplyCommand(string line)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(line);
            JsonElement root = document.RootElement;
            if (
                root.ValueKind != JsonValueKind.Object ||
                !root.TryGetProperty("type", out JsonElement type) ||
                type.ValueKind != JsonValueKind.String ||
                type.GetString() != "wallpaper-enabled" ||
                !root.TryGetProperty("value", out JsonElement value) ||
                (value.ValueKind != JsonValueKind.True && value.ValueKind != JsonValueKind.False)
            )
            {
                return false;
            }

            Volatile.Write(ref _enabled, value.GetBoolean() ? 1 : 0);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}

internal sealed class WasapiLoopbackCapture : IDisposable
{
    private static readonly Guid ClsidMmDeviceEnumerator = new("BCDE0395-E52F-467C-8E3D-C4579291692E");
    private static readonly Guid IidIAudioClient = new("1CB9AD4C-DBFA-4c32-B178-C2F568A703B2");
    private static readonly Guid IidIAudioCaptureClient = new("C8ADBD64-E71E-48a0-A4DE-185C395CD317");
    private static readonly Guid KsdDataFormatSubtypePcm = new("00000001-0000-0010-8000-00AA00389B71");
    private static readonly Guid KsdDataFormatSubtypeIeeeFloat = new("00000003-0000-0010-8000-00AA00389B71");

    private readonly IMMDeviceEnumerator _deviceEnumerator;
    private readonly IMMDevice _device;
    private readonly IAudioClient _audioClient;
    private readonly IAudioCaptureClient _captureClient;
    private readonly IntPtr _mixFormatPointer;
    private readonly WaveFormatEx _mixFormat;
    private readonly SampleFormat _sampleFormat;
    private readonly int _bytesPerSample;
    private readonly int _channelCount;
    private byte[] _sampleBuffer = Array.Empty<byte>();
    private bool _isStarted;
    private double _lastLevel;

    public WasapiLoopbackCapture()
    {
        // MMDevice gives us the current default speaker/device on Windows.
        var enumeratorType = Type.GetTypeFromCLSID(ClsidMmDeviceEnumerator)
            ?? throw new InvalidOperationException("Could not create the Windows audio device enumerator.");

        _deviceEnumerator = (IMMDeviceEnumerator)Activator.CreateInstance(enumeratorType)!;

        Marshal.ThrowExceptionForHR(
            _deviceEnumerator.GetDefaultAudioEndpoint(EDataFlow.eRender, ERole.eMultimedia, out _device));

        var audioClientGuid = IidIAudioClient;
        Marshal.ThrowExceptionForHR(
            _device.Activate(ref audioClientGuid, ClsCtx.CLSCTX_ALL, IntPtr.Zero, out var audioClientObject));

        _audioClient = (IAudioClient)audioClientObject;

        // The shared-mode mix format is the simplest format to use for loopback capture.
        Marshal.ThrowExceptionForHR(_audioClient.GetMixFormat(out _mixFormatPointer));
        _mixFormat = Marshal.PtrToStructure<WaveFormatEx>(_mixFormatPointer);

        (_sampleFormat, _bytesPerSample) = DetectSampleFormat(_mixFormatPointer, _mixFormat);
        _channelCount = _mixFormat.nChannels;

        Marshal.ThrowExceptionForHR(_audioClient.GetDevicePeriod(out var defaultPeriod, out var minimumPeriod));
        var bufferDuration = Math.Max(minimumPeriod, TimeSpan.FromMilliseconds(10).Ticks);

        Marshal.ThrowExceptionForHR(
            _audioClient.Initialize(
                AudioClientShareMode.Shared,
                AudioClientStreamFlags.Loopback,
                bufferDuration,
                0,
                _mixFormatPointer,
                IntPtr.Zero));

        var captureClientGuid = IidIAudioCaptureClient;
        Marshal.ThrowExceptionForHR(
            _audioClient.GetService(ref captureClientGuid, out var captureClientObject));

        _captureClient = (IAudioCaptureClient)captureClientObject;

        Marshal.ThrowExceptionForHR(_audioClient.Start());
        _isStarted = true;
    }

    public double ReadLevel()
    {
        double sumSquares = 0;
        var sampleCount = 0;

        while (true)
        {
            Marshal.ThrowExceptionForHR(_captureClient.GetNextPacketSize(out var nextPacketFrames));

            if (nextPacketFrames == 0)
            {
                break;
            }

            IntPtr dataPointer = IntPtr.Zero;
            uint framesRead = 0;

            Marshal.ThrowExceptionForHR(
                _captureClient.GetBuffer(
                    out dataPointer,
                    out framesRead,
                    out var flags,
                    out _,
                    out _));

            try
            {
                var packetSampleCount = checked((int)framesRead * _channelCount);

                if ((flags & AudioClientBufferFlags.Silent) != 0)
                {
                    sampleCount += packetSampleCount;
                    continue;
                }

                AccumulateSamples(dataPointer, packetSampleCount, ref sumSquares, ref sampleCount);
            }
            finally
            {
                Marshal.ThrowExceptionForHR(_captureClient.ReleaseBuffer(framesRead));
            }
        }

        if (sampleCount > 0)
        {
            // RMS gives us a smooth loudness-style value for the visualizer.
            _lastLevel = Math.Sqrt(sumSquares / sampleCount);
        }
        else
        {
            // When no packet arrives, decay gently instead of snapping to zero.
            _lastLevel *= 0.92;
        }

        return Math.Clamp(_lastLevel, 0, 1);
    }

    private void AccumulateSamples(IntPtr dataPointer, int sampleCount, ref double sumSquares, ref int totalSamples)
    {
        var byteCount = checked(sampleCount * _bytesPerSample);
        EnsureSampleBufferSize(byteCount);
        Marshal.Copy(dataPointer, _sampleBuffer, 0, byteCount);

        for (var sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++)
        {
            var offset = sampleIndex * _bytesPerSample;
            var sample = ReadNormalizedSample(_sampleBuffer, offset);

            sumSquares += sample * sample;
            totalSamples++;
        }
    }

    private double ReadNormalizedSample(byte[] buffer, int offset)
    {
        return _sampleFormat switch
        {
            SampleFormat.Float32 => ClampAudioSample(BitConverter.ToSingle(buffer, offset)),
            SampleFormat.Pcm16 => BitConverter.ToInt16(buffer, offset) / 32768.0,
            SampleFormat.Pcm24 => ReadInt24(buffer, offset) / 8388608.0,
            SampleFormat.Pcm32 => BitConverter.ToInt32(buffer, offset) / 2147483648.0,
            _ => throw new NotSupportedException("Unsupported sample format.")
        };
    }

    private static double ClampAudioSample(double value)
    {
        if (value > 1)
        {
            return 1;
        }

        if (value < -1)
        {
            return -1;
        }

        return value;
    }

    private static int ReadInt24(byte[] buffer, int offset)
    {
        var value = buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);

        if ((value & 0x0080_0000) != 0)
        {
            value |= unchecked((int)0xFF00_0000);
        }

        return value;
    }

    private void EnsureSampleBufferSize(int requiredSize)
    {
        if (_sampleBuffer.Length >= requiredSize)
        {
            return;
        }

        _sampleBuffer = new byte[requiredSize];
    }

    private static (SampleFormat Format, int BytesPerSample) DetectSampleFormat(IntPtr mixFormatPointer, WaveFormatEx mixFormat)
    {
        var channelCount = Math.Max(1, (int)mixFormat.nChannels);
        var bytesPerSample = mixFormat.nBlockAlign / channelCount;

        return mixFormat.wFormatTag switch
        {
            WaveFormatTags.Pcm => bytesPerSample switch
            {
                2 => (SampleFormat.Pcm16, bytesPerSample),
                3 => (SampleFormat.Pcm24, bytesPerSample),
                4 => (SampleFormat.Pcm32, bytesPerSample),
                _ => throw new NotSupportedException($"Unsupported PCM sample size: {bytesPerSample} bytes.")
            },
            WaveFormatTags.IeeeFloat when bytesPerSample == 4 => (SampleFormat.Float32, bytesPerSample),
            WaveFormatTags.Extensible => DetectExtensibleFormat(mixFormatPointer, bytesPerSample),
            _ => throw new NotSupportedException($"Unsupported wave format tag: 0x{mixFormat.wFormatTag:X4}.")
        };
    }

    private static (SampleFormat Format, int BytesPerSample) DetectExtensibleFormat(IntPtr mixFormatPointer, int bytesPerSample)
    {
        var extensible = Marshal.PtrToStructure<WaveFormatExtensible>(mixFormatPointer);

        if (extensible.SubFormat == KsdDataFormatSubtypeIeeeFloat && bytesPerSample == 4)
        {
            return (SampleFormat.Float32, bytesPerSample);
        }

        if (extensible.SubFormat == KsdDataFormatSubtypePcm)
        {
            return bytesPerSample switch
            {
                2 => (SampleFormat.Pcm16, bytesPerSample),
                3 => (SampleFormat.Pcm24, bytesPerSample),
                4 => (SampleFormat.Pcm32, bytesPerSample),
                _ => throw new NotSupportedException($"Unsupported extensible PCM sample size: {bytesPerSample} bytes.")
            };
        }

        throw new NotSupportedException($"Unsupported extensible sub-format: {extensible.SubFormat}.");
    }

    public void Dispose()
    {
        if (_isStarted)
        {
            _audioClient.Stop();
            _isStarted = false;
        }

        if (_mixFormatPointer != IntPtr.Zero)
        {
            Marshal.FreeCoTaskMem(_mixFormatPointer);
        }

        Marshal.ReleaseComObject(_captureClient);
        Marshal.ReleaseComObject(_audioClient);
        Marshal.ReleaseComObject(_device);
        Marshal.ReleaseComObject(_deviceEnumerator);
    }
}

internal enum SampleFormat
{
    Float32,
    Pcm16,
    Pcm24,
    Pcm32
}

internal enum EDataFlow
{
    eRender = 0,
    eCapture = 1,
    eAll = 2
}

internal enum ERole
{
    eConsole = 0,
    eMultimedia = 1,
    eCommunications = 2
}

[Flags]
internal enum ClsCtx : uint
{
    CLSCTX_INPROC_SERVER = 0x1,
    CLSCTX_INPROC_HANDLER = 0x2,
    CLSCTX_LOCAL_SERVER = 0x4,
    CLSCTX_REMOTE_SERVER = 0x10,
    CLSCTX_ALL = CLSCTX_INPROC_SERVER | CLSCTX_INPROC_HANDLER | CLSCTX_LOCAL_SERVER | CLSCTX_REMOTE_SERVER
}

internal enum AudioClientShareMode
{
    Shared = 0,
    Exclusive = 1
}

[Flags]
internal enum AudioClientStreamFlags : uint
{
    Loopback = 0x00020000
}

[Flags]
internal enum AudioClientBufferFlags : uint
{
    None = 0x0,
    DataDiscontinuity = 0x1,
    Silent = 0x2,
    TimestampError = 0x4
}

internal static class WaveFormatTags
{
    public const ushort Pcm = 0x0001;
    public const ushort IeeeFloat = 0x0003;
    public const ushort Extensible = 0xFFFE;
}

[StructLayout(LayoutKind.Sequential, Pack = 2)]
internal struct WaveFormatEx
{
    public ushort wFormatTag;
    public ushort nChannels;
    public uint nSamplesPerSec;
    public uint nAvgBytesPerSec;
    public ushort nBlockAlign;
    public ushort wBitsPerSample;
    public ushort cbSize;
}

[StructLayout(LayoutKind.Sequential, Pack = 2)]
internal struct WaveFormatExtensible
{
    public WaveFormatEx Format;
    public ushort wValidBitsPerSample;
    public uint dwChannelMask;
    public Guid SubFormat;
}

[ComImport]
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDeviceEnumerator
{
    int EnumAudioEndpoints(EDataFlow dataFlow, int stateMask, out object devices);
    int GetDefaultAudioEndpoint(EDataFlow dataFlow, ERole role, out IMMDevice endpoint);
    int GetDevice(string id, out IMMDevice device);
    int RegisterEndpointNotificationCallback(IntPtr client);
    int UnregisterEndpointNotificationCallback(IntPtr client);
}

[ComImport]
[Guid("D666063F-1587-4E43-81F1-B948E807363F")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDevice
{
    int Activate(ref Guid iid, ClsCtx clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object instance);
    int OpenPropertyStore(int stgmAccess, out IntPtr properties);
    int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
    int GetState(out int state);
}

[ComImport]
[Guid("1CB9AD4C-DBFA-4c32-B178-C2F568A703B2")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioClient
{
    int Initialize(
        AudioClientShareMode shareMode,
        AudioClientStreamFlags streamFlags,
        long bufferDuration,
        long periodicity,
        IntPtr format,
        IntPtr audioSessionGuid);

    int GetBufferSize(out uint bufferSize);
    int GetStreamLatency(out long latency);
    int GetCurrentPadding(out uint currentPadding);
    int IsFormatSupported(AudioClientShareMode shareMode, IntPtr format, out IntPtr closestMatchFormat);
    int GetMixFormat(out IntPtr deviceFormatPointer);
    int GetDevicePeriod(out long defaultDevicePeriod, out long minimumDevicePeriod);
    int Start();
    int Stop();
    int Reset();
    int SetEventHandle(IntPtr eventHandle);
    int GetService(ref Guid iid, [MarshalAs(UnmanagedType.IUnknown)] out object service);
}

[ComImport]
[Guid("C8ADBD64-E71E-48a0-A4DE-185C395CD317")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioCaptureClient
{
    int GetBuffer(
        out IntPtr data,
        out uint numFramesToRead,
        out AudioClientBufferFlags flags,
        out ulong devicePosition,
        out ulong qpcPosition);

    int ReleaseBuffer(uint numFramesRead);
    int GetNextPacketSize(out uint numFramesInNextPacket);
}

internal static class WallpaperColorExtractor
{
    private static string? _lastWallpaperPath = null;
    private static List<string>? _lastColors = null;

    public static List<string>? GetWallpaperColors()
    {
        try
        {
            string? wallpaperPath = Registry.GetValue(@"HKEY_CURRENT_USER\Control Panel\Desktop", "Wallpaper", null) as string;
            
            if (string.IsNullOrEmpty(wallpaperPath) || !File.Exists(wallpaperPath))
            {
                return null;
            }

            if (wallpaperPath == _lastWallpaperPath && _lastColors != null)
            {
                return _lastColors;
            }

            var colors = ExtractColors(wallpaperPath);
            if (colors != null && colors.Count == 3)
            {
                _lastWallpaperPath = wallpaperPath;
                _lastColors = colors;
                return colors;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[WallpaperColorExtractor] Error: {ex.Message}");
        }

        return null;
    }

    private static List<string>? ExtractColors(string path)
    {
        try
        {
            using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var originalBitmap = new Bitmap(stream);
            using var resizedBitmap = new Bitmap(32, 32);
            
            using (var g = Graphics.FromImage(resizedBitmap))
            {
                g.InterpolationMode = InterpolationMode.HighQualityBilinear;
                g.DrawImage(originalBitmap, 0, 0, 32, 32);
            }

            var colorBuckets = new Dictionary<int, List<Color>>();
            for (int y = 0; y < resizedBitmap.Height; y++)
            {
                for (int x = 0; x < resizedBitmap.Width; x++)
                {
                    Color pixel = resizedBitmap.GetPixel(x, y);
                    // Quantize R, G, B to 4 bits each (16 levels)
                    int qr = pixel.R / 16;
                    int qg = pixel.G / 16;
                    int qb = pixel.B / 16;
                    int bucketKey = (qr << 8) | (qg << 4) | qb;

                    if (!colorBuckets.ContainsKey(bucketKey))
                    {
                        colorBuckets[bucketKey] = new List<Color>();
                    }
                    colorBuckets[bucketKey].Add(pixel);
                }
            }

            var sortedBuckets = colorBuckets.OrderByDescending(kvp => kvp.Value.Count).ToList();
            var distinctColors = new List<Color>();

            foreach (var bucket in sortedBuckets)
            {
                // Calculate average color of the bucket
                long totalR = 0, totalG = 0, totalB = 0;
                foreach (var c in bucket.Value)
                {
                    totalR += c.R;
                    totalG += c.G;
                    totalB += c.B;
                }
                int count = bucket.Value.Count;
                var avgColor = Color.FromArgb((int)(totalR / count), (int)(totalG / count), (int)(totalB / count));

                // Check if distinct enough from already selected colors
                bool isDistinct = true;
                foreach (var selected in distinctColors)
                {
                    double dist = ColorDistance(avgColor, selected);
                    if (dist < 45.0) // Threshold for color difference
                    {
                        isDistinct = false;
                        break;
                    }
                }

                if (isDistinct)
                {
                    distinctColors.Add(avgColor);
                    if (distinctColors.Count == 3)
                    {
                        break;
                    }
                }
            }

            // If we didn't find 3 distinct colors, lower the threshold and try again
            if (distinctColors.Count < 3)
            {
                foreach (var bucket in sortedBuckets)
                {
                    long totalR = 0, totalG = 0, totalB = 0;
                    foreach (var c in bucket.Value)
                    {
                        totalR += c.R;
                        totalG += c.G;
                        totalB += c.B;
                    }
                    int count = bucket.Value.Count;
                    var avgColor = Color.FromArgb((int)(totalR / count), (int)(totalG / count), (int)(totalB / count));

                    bool alreadyAdded = distinctColors.Any(c => ColorDistance(c, avgColor) < 5.0);
                    if (!alreadyAdded)
                    {
                        distinctColors.Add(avgColor);
                        if (distinctColors.Count == 3)
                        {
                            break;
                        }
                    }
                }
            }

            // If still fewer than 3, pad with variations of the first color, or a default fallback
            if (distinctColors.Count == 0)
            {
                distinctColors.Add(Color.FromArgb(79, 172, 254)); // #4facfe
            }

            while (distinctColors.Count < 3)
            {
                var baseColor = distinctColors[0];
                if (distinctColors.Count == 1)
                {
                    // Create a lighter variant
                    distinctColors.Add(ShiftColor(baseColor, 0.2));
                }
                else if (distinctColors.Count == 2)
                {
                    // Create a darker variant
                    distinctColors.Add(ShiftColor(baseColor, -0.2));
                }
            }

            return distinctColors.Select(c => $"#{c.R:X2}{c.G:X2}{c.B:X2}").ToList();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[WallpaperColorExtractor] ExtractColors failed: {ex.Message}");
        }

        return null;
    }

    private static double ColorDistance(Color c1, Color c2)
    {
        int dr = c1.R - c2.R;
        int dg = c1.G - c2.G;
        int db = c1.B - c2.B;
        return Math.Sqrt(dr * dr + dg * dg + db * db);
    }

    private static Color ShiftColor(Color c, double amount)
    {
        int r = clamp((int)(c.R + amount * 255));
        int g = clamp((int)(c.G + amount * 255));
        int b = clamp((int)(c.B + amount * 255));
        return Color.FromArgb(r, g, b);
    }

    private static int clamp(int val)
    {
        return Math.Max(0, Math.Min(255, val));
    }
}

