import React, { useState } from 'react';

const InputBox = ({ name, type, id, value, placeholder, icon }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className='relative w-[100%] mb-4'>
      <input
        name={name}
        type={
          type == 'password' ? passwordVisible ? 'text' : 'password' : type
        }
        placeholder={placeholder}
        defaultValue={value}
        id={id}
        className='input-box text-base'
        style={{ fontSize: '16px'}}
      />

      <i className={'fi ' + icon + ' input-icon'}></i>

      {type == 'password' ? (
        <i
          className={'fi fi-rr-eye' + (!passwordVisible ? '-crossed': '') + ' input-icon left-[auto] right-4 cursor-pointer text-base'}
          style={{ fontSize: '16px'}}
          onClick={() => setPasswordVisible((currentVal) => !currentVal)}
        ></i>
      ) : (
        ''
      )}
    </div>
  );
};

export default InputBox;
