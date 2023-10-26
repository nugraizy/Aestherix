#!/bin/bash

echo "Checking ffmpeg"
if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpeg not found."
    echo "Installing ffmpeg..."
    sudo apt-get update
    sudo apt-get install ffmpeg -y
fi

echo "Checking required packages for libwebp"
if ! dpkg -l | grep libjpeg-dev &> /dev/null; then
    echo "Installing libjpeg-dev..."
    sudo apt-get update
    sudo apt-get install libjpeg-dev -y
fi

if ! dpkg -l | grep libpng-dev &> /dev/null; then
    echo "Installing libpng-dev..."
    sudo apt-get update
    sudo apt-get install libpng-dev -y
fi

if ! dpkg -l | grep libtiff-dev &> /dev/null; then
    echo "Installing libtiff-dev..."
    sudo apt-get update
    sudo apt-get install libtiff-dev -y
fi

if ! dpkg -l | grep libgif-dev &> /dev/null; then
    echo "Installing libgif-dev..."
    sudo apt-get update
    sudo apt-get install libgif-dev -y
fi

echo "Checking libwebp installation"
if ! command -v cwebp &> /dev/null; then
    echo "libwebp not found."
    echo "Installing libwebp..."
    wget https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.3.2.tar.gz
    tar xvzf libwebp-1.3.2.tar.gz
    cd libwebp-1.3.2
    ./configure
    make
    sudo make install
    cd ..
fi

echo "All required packages are installed."
