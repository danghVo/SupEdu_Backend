export default function fail() {
    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mail xác nhận</title>
    </head>
    <body style="overflow: hidden">
        <div style="display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100vh">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width: 40px; height: 40px">
                <path
                    fill="#fd1717"
                    d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"
                />
            </svg>
            <h1>Xác nhận thất bại</h1>
            <h3>Token hết hạn hoặc sai. Hãy cập nhật mail mới nhất hoặc đăng ký lại</h3>
        </div>
    </body>
</html>`;
}
