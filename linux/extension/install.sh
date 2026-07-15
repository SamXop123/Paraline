#!/bin/bash
UUID="paraline-companion@samxop123.github.com"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"

mkdir -p "$DEST"
cp metadata.json extension.js "$DEST"

echo "Extension copied to $DEST"
echo "Please restart GNOME Shell (or log out and log in under Wayland) and enable the extension using:"
echo "gnome-extensions enable $UUID"
