#!/bin/bash
set -e

LOG_FILE="installation.txt"

echo "=== Dependency Installer ==="

# Detect package manager
if command -v apt-get &> /dev/null; then
    PM="apt-get"
    INSTALL="sudo apt-get install -y -qq"
    PKG_CHECK="dpkg -l"
elif command -v pacman &> /dev/null; then
    PM="pacman"
    INSTALL="sudo pacman -S --noconfirm --needed"
    PKG_CHECK="pacman -Q"
else
    echo "Error: No supported package manager found (apt-get or pacman required)."
    exit 1
fi

echo "Using package manager: $PM"
echo "Logging to $LOG_FILE"

# Package lists
DEBIAN_PACKAGES=(
    ffmpeg libjpeg-dev libpng-dev libtiff-dev libgif-dev librsvg2-dev
    pkg-config build-essential libcairo2-dev libpixman-1-dev libpango1.0-dev
    libheif1 libheif-dev libde265-0 libde265-dev imagemagick heif-gdk-pixbuf
)

ARCH_PACKAGES=(
    ffmpeg libjpeg libpng libtiff giflib librsvg pkgconf base-devel cairo pixman
    pango libheif libde265 imagemagick gdk-pixbuf2 libwebp
)

# Install dependencies
if [[ "$PM" == "apt-get" ]]; then
    echo "Installing Debian/Ubuntu packages..."
    $INSTALL "${DEBIAN_PACKAGES[@]}" > "$LOG_FILE" 2>&1
elif [[ "$PM" == "pacman" ]]; then
    echo "Installing Arch Linux packages..."
    $INSTALL "${ARCH_PACKAGES[@]}" > "$LOG_FILE" 2>&1
fi

# Check libwebp installation (cwebp binary)
if ! command -v cwebp &> /dev/null; then
    echo "libwebp not found. Building from source..."
    wget -q https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.6.0.tar.gz
    tar xf libwebp-1.6.0.tar.gz
    cd libwebp-1.6.0
    ./configure >> ../"$LOG_FILE" 2>&1
    make >> ../"$LOG_FILE" 2>&1
    sudo make install >> ../"$LOG_FILE" 2>&1
    cd ..
    rm -rf libwebp-1.6.0 libwebp-1.6.0.tar.gz
else
    echo "libwebp is already installed."
fi

echo "All required packages are installed."
