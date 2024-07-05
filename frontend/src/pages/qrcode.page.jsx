import React, { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from '../App';
import QRCodeStyling from "qr-code-styling";
import toast from 'react-hot-toast';

const QrCodePage = () => {
  const [url, setUrl] = useState('');
  const [qrCodeInstance, setQrCodeInstance] = useState(null);
  const [isQrCodeVisible, setIsQrCodeVisible] = useState(false);
  const qrCodeRef = useRef(null);

  const {
    userAuth: { id, eventName },
  } = useContext(UserContext);

  useEffect(() => {
    if (id && eventName) {
      setUrl(`http://localhost:5173/ranking/${id}?eventName=${encodeURIComponent(eventName)}`);
    } else {
      toast.error('행사 혹은 아이디를 확인해주세요.', {
        duration: 2000, // 2초 동안 표시
      });
    }
  }, [id, eventName]);

  useEffect(() => {
    if (url) {
      const qrCode = new QRCodeStyling({
        width: 300,
        height: 300,
        data: url,
        image: "",
        dotsOptions: {
          color: "#000000",
          type: "rounded"
        },
        backgroundOptions: {
          color: "#ffffff",
        }
      });
      setQrCodeInstance(qrCode);
    }
  }, [url]);

  useEffect(() => {
    if (qrCodeInstance && qrCodeRef.current && isQrCodeVisible) {
      qrCodeInstance.append(qrCodeRef.current);
    }
  }, [qrCodeInstance, isQrCodeVisible]);

  const handleGenerateClick = () => {
    if (qrCodeInstance) {
      qrCodeInstance.update({ data: url });
      setIsQrCodeVisible(true);

      const timer = setTimeout(() => {
        setIsQrCodeVisible(false);
      }, 60000); // 1분 = 60000ms

      return () => clearTimeout(timer); // 컴포넌트 언마운트 시 타이머 클리어
    }
  };

  const handleDownload = () => {
    if (qrCodeInstance) {
      qrCodeInstance.download({ name: "qr-code", extension: "png" });
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white shadow-md rounded-xl">
      <h2 className="text-2xl font-bold mb-4 text-center">QR코드 생성하기</h2>
      <p className="mb-4 text-center">아래 버튼을 클릭하면 광고 영상 시청 후 행사 참여자들이 실시간으로 순위와 점수 현황을 볼 수 있는 QR 코드가 생성됩니다. </p>
      <button
        className="w-full mb-4 rounded-xl bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-pink-400 hover:to-red-500 px-6 py-3 font-bold text-white text-xl flex justify-center"
        onClick={handleGenerateClick}
      >
        생성하기
      </button>
      {isQrCodeVisible && url && (
        <div className="flex justify-center items-center flex-col">
          <div ref={qrCodeRef}></div>
          <p className="mt-4">위의 QR 코드를 스캔하면 접속할 수 있습니다.</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            onClick={handleDownload}
          >
            QR 코드 다운로드
          </button>
        </div>
      )}
    </div>
  );
};

export default QrCodePage;
