export default function success() {
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
                    fill="#13b984"
                    d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
                />
            </svg>
            <h1>Xác nhận thành công</h1>
        </div>
    </body>
</html>`;
}
