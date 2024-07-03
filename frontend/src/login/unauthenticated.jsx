import React, { useContext } from 'react';
import './unauthenticated.css';
import InputBox from '../components/input.component';
import { Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

import { storeInSession } from '../common/session';
import { UserContext } from '../App';

export function Unauthenticated(props) {
  let {
    userAuth: { access_token },
    setUserAuth,
  } = useContext(UserContext);

  const [displayError, setDisplayError] = React.useState(null);

  async function loginUser(e)  {
    let id = toast.loading("로그인 중입니다.");
    e.preventDefault();
    // formData
    let form = new FormData(formElement);
    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }
    loginOrCreate(`/api/auth/login`, formData, id);
  }

  async function loginOrCreate(endpoint, formData, id) {
    const response = await fetch(endpoint, {
      method: 'post',
      body: JSON.stringify(formData),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });
    if (response?.status === 200) {
        const scoresAndTokenAndId = await response.json();
        toast.success(`로그인 성공`, {
            id: id,
            duration: 1000
    });
    setTimeout(() => {
        storeInSession('user', JSON.stringify(scoresAndTokenAndId));
        setUserAuth(scoresAndTokenAndId);
    }, 1000);      
    } else {
      // const body = await response.json();
      toast.error(`로그인 실패: 아이디 또는 비밀번호를 \n다시 확인해주세요.`, {
            id: id,
            duration: 2000
      });
    }
  }

  return access_token ? (
    <Navigate to='/rank' />
  ) : (
    <>
      <div className='h-cover flex flex-col items-center justify-center'>
      <Toaster/>
        <form id='formElement' className='w-[80%] max-w-[400px]'>
          <InputBox
            name='id'
            type='id'
            placeholder='아이디를 입력하세요.'
            icon='fi-rr-envelope'
          />
          <InputBox
            name='password'
            type='password'
            placeholder='비밀번호를 입력하세요.'
            icon='fi-rr-key'
          />
          <button
              className='btn-pink center mt-14'
              type='submit'
              onClick={loginUser}
            >
            로그인
          </button>
        </form>
      </div>
    </>
  );
}
