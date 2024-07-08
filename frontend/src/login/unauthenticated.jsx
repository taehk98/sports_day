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
    loginOrCreate(`/api/auth/login`, formData, id, "로그인");
  }

  async function createUser(e)  {
    let id = toast.loading("아이디 생성중입니다.");
    e.preventDefault();
    // formData
    let form = new FormData(formElement);
    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }
    loginOrCreate(`/api/auth/create`, formData, id, "아이디 생성");
  }

  async function loginOrCreate(endpoint, formData, id, text) {
    try {
      const response = await fetch(endpoint, {
        method: 'post',
        body: JSON.stringify(formData),
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      });
  
      const responseBody = await response.json();
  
      if (response?.status === 200) {
        const scoresAndTokenAndId = responseBody;
        let msg = text === "로그인" ? "로그인 성공" : "아이디 생성 성공";
        toast.success(msg, {
          id: id,
          duration: 1000
        });
        setTimeout(() => {
          storeInSession('user', JSON.stringify(scoresAndTokenAndId));
          setUserAuth(scoresAndTokenAndId);
        }, 1000);
      } else {
        throw new Error(responseBody.msg);
      }
    } catch (error) {
      let message = text === "로그인" ? '로그인 중 오류가 발생했습니다.' : '아이디 생성 중 오류가 발생했습니다.';
      toast.error(`${message} \n${error.message}`, {
        id: id,
        duration: 2000
      });
    }
  }

  return access_token ? (
    <Navigate to='/events' />
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
          <div className='flex flex-items'>
            <button
                className='btn-dark center mt-6'
                type='submit'
                onClick={createUser}
              >
              회원가입
            </button>
            <button
                className='btn-pink center mt-6'
                type='submit'
                onClick={loginUser}
              >
              로그인
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
