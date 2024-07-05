import React, { useState } from 'react';
import QRCode from 'qrcode.react';

const QRCodePage = () => {
  const [url, setUrl] = useState('');

  const handleChange = (e) => {
    setUrl(e.target.value);
  };

  return (
    <div>
      <h2>URL을 QR 코드로 변환하기</h2>
      <label htmlFor="qr-url">QR 코드로 변환할 URL 입력:</label>
      <input
        type="text"
        id="qr-url"
        value={url}
        onChange={handleChange}
        placeholder="QR 코드로 변환할 URL을 입력하세요..."
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />
      {url && (
        <div style={{ textAlign: 'center' }}>
          <QRCode value={url} />
          <p>위의 QR 코드를 스캔하면 "{url}"로 접속할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
};

export default QRCodePage;