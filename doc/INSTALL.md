## Linux (Ubuntu / Debian based)

> **IMPORTANT** 
> make sure to install `python`, `gcc`, `g++` and `make`

```sh
# if you haven't installed gcc, g++ and make
sudo apt install gcc g++ make
```

... then install the rest.
```sh
sudo apt install ffmpeg libjpeg-dev libpng-dev libtiff-dev libgif-dev librsvg2-dev pkg-config build-essential libcairo2-dev libpixman-1-dev libpango1.0-dev libheif1 libheif-dev libde265-0 libde265-dev imagemagick heif-gdk-pixbuf -y
```

required for headless operations :
```sh
sudo apt install libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libnss3 lsb-release xdg-utils wget libgbm-dev libnss3-dev
```

install necessary library for converts operations :
```sh
wget "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.6.0.tar.gz"
```

```sh
tar xvzf libwebp-1.6.0.tar.gz
cd libwebp-1.6.0
./configure
make
sudo make install
```



## Arch Based
```sh
sudo pacman -S --needed base-devel ffmpeg libjpeg libpng libtiff giflib librsvg pkgconf cairo pixman pango libheif libde265 imagemagick gdk-pixbuf2 libwebp
```

install necessary library for converts operations :

```sh
wget "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.6.0.tar.gz"
```

```sh
tar xvzf libwebp-1.6.0.tar.gz
cd libwebp-1.6.0
./configure
make
sudo make install
```

---

#### Or you can execute the ./doc/install/install.sh to do everything for you

```sh
chmod +x ./doc/install/install.sh
./doc/install/install.sh
npm i -f
```

---

## Windows

> **IMPORTANT** 
> make sure to install [visual studio community](https://c2rsetup.officeapps.live.com/c2r/downloadVS.aspx?sku=community&channel=Release&version=VS2022&source=VSLandingPage&cid=2030) with `Desktop development with C++` workload selected

`Command Prompt` :
```bash
curl -Lo vs_buildtools.exe https://aka.ms/vs/17/release/vs_buildtools.exe
```

`PowerShell` :
```ps1
Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_buildtools.exe" -OutFile "vs_buildtools.exe"
```

### FFMPEG

1. Download manual using this [link](https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip)
2. Extract it
3. Open the folder, go to bin, copy the path
4. Set/add the Environment path with the copied path

### LIBWEBP

1. Download manual using this [link](https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.6.0-windows-x64.zip)
2. Extract it
3. Open the folder, go to bin, copy the path
4. Set/add the Environment path with the copied path

#### Or you can execute the ./doc/install/install.ps1 to do everything for you

> **IMPORTANT** 
> make sure to use Powershell with `administrator`

```powershell
.\doc\install\install.ps1
npm i -f
```
