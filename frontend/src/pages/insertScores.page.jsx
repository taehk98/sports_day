import React, { useContext, useEffect, useState } from "react";
import { UserContext } from '../App';
import { lookInSession, storeInSession } from '../common/session';
import { Toaster, toast } from 'react-hot-toast';
import {
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCol,
  MDBContainer,
  MDBRow,
} from "mdb-react-ui-kit";
import Dropdown from '../components/dropdown.component';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { faCircle } from '@fortawesome/free-regular-svg-icons';


const InsertScores = () => {
  const [score, setScore] = useState('');
  const [activityId, setActivityId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [currentScore, setCurrentScore] = useState(null);
  const [participateNum, setParticipateNum] = useState(null);

  const {
    userAuth: { access_token, id, eventName},
    setUserAuth,
  } = useContext(UserContext);


  async function fetchScoreAndParticipation() {
    if(activityId === '' || activityId === undefined || activityId === null || 
      teamName === '' || teamName === undefined || teamName === null) {
        toast.error('팀과 활동을 선택해주세요.', { duration: 2000 });
        return;
    }
    try {
        const response = await fetch(`/api/get-score-and-participation/${id}?teamName=${teamName}&activityId=${activityId}&eventName=${encodeURIComponent(eventName)}`);
        if (response.ok) {
            const data = await response.json();
            if(activityId !== '' && activityId !== undefined && activityId !== null) {
                setCurrentScore(data.score);
            }
            setParticipateNum(data.participateNum);
            toast.success('데이터를 가져왔습니다.', { duration: 1000 });
        } else {
            if(activityId !== '' && activityId !== undefined && activityId !== null) {
                toast.error('팀을 확인해주세요.', { duration: 2000 });
            }else {
                toast.error('팀와 활동을 확인해주세요.', { duration: 2000 });
            }
            
        }
    } catch (error) {
      toast.error('데이터를 가져오는데 실패했습니다.', { duration: 2000 });
    }
    
  }

  async function updateScores(newScore, activityId, teamName) {
    if (isNaN(newScore) || newScore < 0 || newScore > 100) {
        toast.error('0부터 100 사이의 숫자를 기입해주세요', {
            duration: 2000
        });
        return;
    }
    try {
        const response = await fetch(`/api/update-score-by-activity?eventName=${encodeURIComponent(eventName)}`, {
            method: 'PUT',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            activityId,
            teamName,
            newScore,
            id
            })
        });

      if (response.ok) {
        const scoresAndToken = await response.json();
        storeInSession('data', JSON.stringify(scoresAndToken.updatedScores));
        toast.success('점수를 업데이트했습니다.', {
          duration: 1000,
        });
      }
    } catch (error) {
      toast.error('점수 업데이트에 실패했습니다.', {
        duration: 2000,
      });
    }
  }

  const handleAddScore = (e) => {
    e.preventDefault();
    if(activityId === '' || activityId === undefined || activityId === null || 
      teamName === '' || teamName === undefined || teamName === null) {
        toast.error('팀과 활동을 선택해주세요.', { duration: 2000 });
        return;
    }
    if (score.trim() && activityId && teamName) {
      updateScores(score, activityId, teamName);
      setScore('');
    } else {
      toast.error('점수를 입력해주세요.', {
        duration: 2000,
      });
    }
  };

  return (
    <>
      {access_token && (
        <MDBContainer className="py-2 overflow-y-auto sticky" style={{ height: 'calc(100vh - 80px)' }}>
          <MDBRow className="d-flex justify-content-center">
            <MDBCol className="w-full">
              <MDBCard id="list1" style={{ borderRadius: ".75rem", backgroundColor: "#FFE6E6" }} className="w-full">
                <MDBCardBody className="py-2 px-3 px-md-5">
                  <p className="text-center py-2">
                    <u className='font-bold text-3xl no-underline'>점수 관리</u>
                  </p>
                  <div className="pb-1">
                    <MDBCard className="w-full">
                      <MDBCardBody>
                        <div className="d-flex flex-column align-items-center w-full">
                          <Dropdown
                            endpoint={`/api/teams/${id}?eventName=${encodeURIComponent(eventName)}`}
                            placeholder="팀을 선택하세요."
                            style={{ fontSize: '16px'}}
                            onChange={(selectedOption) => setTeamName(selectedOption.value)}
                          />
                        </div>
                        <div className="d-flex flex-column align-items-center mt-2 w-full">
                          <Dropdown
                            endpoint={`/api/get-activityList/${id}?eventName=${encodeURIComponent(eventName)}`}
                            placeholder="활동을 선택하세요."
                            style={{ fontSize: '16px'}}
                            onChange={(selectedOption) => setActivityId(selectedOption.value)}
                          />
                        </div>
                        <div className="flex justify-content-center py-2 pt-3">
                          <button onClick={() => fetchScoreAndParticipation()} className="md:w-48 bg-ppink text-white px-3 py-2 rounded hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50">
                            점수 조회
                          </button>
                        </div>
                        {currentScore !== null && activityId !== null && (
                            <div className="text-center w-full">
                                <p className="text-xl font-semibold mb-2 mt-2">현재 점수:</p>
                                <div className="bg-gray-100 rounded-lg p-2 mx-auto w-32">
                                <p className="text-2xl text-pink-500">{currentScore}</p>
                                </div>
                            </div>
                            )}  
                        <div className="border-t border-gray-300 my-4"></div>
                        <div className="d-flex flex-column align-items-center mt-6 md:justify-content-center md:items-center md:flex md:w-full">
                          <form onSubmit={handleAddScore} className="w-3/5 md:w-96">
                            <input
                              type="number"
                              className="form-control form-control-lg w-full border text-base"
                              style={{ fontSize: '16px'}}
                              placeholder="점수를 입력하세요."
                              value={score}
                              onChange={(e) => setScore(e.target.value)}
                            />
                            <div className='flex justify-content-center mt-2'>
                                <button type="submit" className="md:w-48 bg-ppink text-white px-3 py-2 rounded hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 mt-2">
                                    점수 업데이트
                                </button>
                            </div>
                            
                          </form>
                        </div>
                      </MDBCardBody>
                    </MDBCard>
                  </div>
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
          </MDBRow>
        </MDBContainer>
      )}
      <Toaster />
    </>
  );
}

export default InsertScores;
