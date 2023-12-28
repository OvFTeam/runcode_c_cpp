# Hướng dẫn cài đặt MinGW

## Các bước cài đặt

### Bước 1: Mở PowerShell với quyền quản trị

- Chuột phải vào biểu tượng PowerShell và chọn "Run as Administrator".

### Bước 2: Cài đặt Chocolatey

- Sao chép và dán lệnh sau vào PowerShell và nhấn Enter:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### Bước 3: Cài đặt MinGW bằng Chocolatey

- Sử dụng lệnh sau để cài đặt MinGW:

```shell
choco install mingw -y
```

Lệnh trên sẽ tự động tải về và cài đặt MinGW trên hệ thống của bạn.

### Bước 4: Kiểm tra

- Để kiểm tra xem MinGW đã được cài đặt thành công hay chưa, bạn có thể sử dụng các lệnh sau:

  - Kiểm tra phiên bản của GCC (GNU Compiler Collection):

    ```shell
    gcc --version
    ```

  - Kiểm tra phiên bản của G++ (GNU C++ Compiler):

    ```shell
    g++ --version
    ```

    Nếu các lệnh trên hiển thị phiên bản của GCC và G++ mà không có bất kỳ lỗi nào, điều đó chứng tỏ MinGW đã được cài đặt thành công.

## Tài liệu tham khảo

- [Trang chủ MinGW](https://mingw-w64.org/)
- [MinGW trên Chocolatey](https://community.chocolatey.org/packages/mingw)
- [Visual Studio Code](https://code.visualstudio.com/docs/cpp/config-mingw#_prerequisites)
