## Linux

> **IMPORTANT** 
> make sure to install `gcc`, `g++` and `make`

```sh
# if you haven't installed gcc, g++ and make
sudo apt install gcc g++ make
```

... then install the rest.
```sh
sudo apt install ffmpeg libjpeg-dev libpng-dev libtiff-dev libgif-dev librsvg2-dev pkg-config build-essential libcairo2-dev libpixman-1-dev libpango1.0-dev -y
```

```sh
wget https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.4.0.tar.gz
```

```sh
tar xvzf libwebp-1.4.0.tar.gz
```

```sh
cd libwebp-1.3.2
./configure
make
sudo make install
```

#### Or you can execute the ./doc/install/install.sh to do everything for you

```sh
chmod +x ./doc/install/install.sh
./doc/install/install.sh
npm i
```

## Windows

> **IMPORTANT** 
> make sure to install [visual studio community](https://c2rsetup.officeapps.live.com/c2r/downloadVS.aspx?sku=community&channel=Release&version=VS2022&source=VSLandingPage&cid=2030) with `Desktop development with C++` workload selected

### FFMPEG

1. Download manual using this [link](https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip)
2. Extract it
3. Open the folder, go to bin, copy the path
4. Set/add the Environment path with the copied path

### LIBWEBP

1. Download manual using this [link](https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.4.0-windows-x64.zip)
2. Extract it
3. Open the folder, go to bin, copy the path
4. Set/add the Environment path with the copied path

#### Or you can execute the ./doc/install/install.ps1 to do everything for you

> **IMPORTANT** 
> make sure to use Powershell with `administrator`

```powershell
.\doc\install\install.ps1
npm i
```
