#!/bin/bash

echo "Checking ffmpeg"
if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpeg not found."
    echo "Installing ffmpeg..."
    sudo apt-get install -qq -y ffmpeg > installation.txt 2>&1
fi

echo "Checking required packages for libwebp"
if ! dpkg -l | grep libjpeg-dev &> /dev/null; then
    echo "Installing libjpeg-dev..."
    sudo apt-get install -y -qq libjpeg-dev > installation.txt 2>&1
fi

if ! dpkg -l | grep libpng-dev &> /dev/null; then
    echo "Installing libpng-dev..."
    sudo apt-get install -y -qq libpng-dev > installation.txt 2>&1
fi

if ! dpkg -l | grep libtiff-dev &> /dev/null; then
    echo "Installing libtiff-dev..."
    sudo apt-get install -y -qq libtiff-dev > installation.txt 2>&1
fi

if ! dpkg -l | grep libgif-dev &> /dev/null; then
    echo "Installing libgif-dev..."
    sudo apt-get install -y -qq libgif-dev > installation.txt 2>&1
fi

echo "Checking libwebp installation"
if ! command -v cwebp &> /dev/null; then
    echo "libwebp not found."
    echo "Installing libwebp..."
    wget https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.4.0.tar.gz
    tar xvzf libwebp-1.4.0.tar.gz
    cd libwebp-1.4.0
    ./configure
    make
    sudo make install
    cd ..
fi

echo "All required packages are installed."
