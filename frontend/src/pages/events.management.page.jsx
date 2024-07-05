import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../App';
import { lookInSession, storeInSession } from '../common/session';
import { Toaster, toast } from 'react-hot-toast';
import { confirmAlert } from 'react-confirm-alert'; 
import { MDBListGroup, MDBListGroupItem, MDBBadge, MDBCard, MDBCardBody, MDBTooltip, MDBIcon } from 'mdb-react-ui-kit';

const EventList = () => {
  const [eventName, setEventName] = useState('');
  const [userData, setUserData] = useState(null); // Initialize userData as null
  const [rows, setRows] = useState([]); // Initialize rows as an empty array

  const {
    userAuth: { access_token, id },
    setUserAuth,
  } = useContext(UserContext);

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const userFromSession = lookInSession('user');
  //       if (userFromSession) {
  //         const parsedUser = JSON.parse(userFromSession);
  //         setUserData(parsedUser);
  //         setRows(parsedUser.eventList.events || []);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching user data:', error);
  //     }
  //   };

  //   fetchUserData();
  // }, []);

  const getEventList = async () => {
    let toastId = toast.loading("행사 리스트를 가져오는 중 입니다...");
    try {
      const response = await fetch(`/api/get-eventList/${id}`, {
        method: 'GET',
      });
  
      if (!response.ok) {
        throw new Error('행사 리스트를 가져오는데 실패했습니다.');
      }
  
      const eventData = await response.json();
      // storeInSession('user', JSON.stringify(eventData));
      // storeInSession('data', JSON.stringify(eventData.scores));
      setRows(eventData.eventList.events || []);
      console.log(eventData)

      toast.success('행사 리스트를 가져왔습니다.', {
        id: toastId,
        duration: 1000, // 2초 동안 표시
        });   
    } catch (error) {
        toast.error('행사 리스트를 불러오는데 실패했습니다.', {
            id: toastId,
            duration: 2000, // 3초 동안 표시
        });
    }
  }

  useEffect(() => {
      getEventList();
  }, []);

  const addEvent = async () => {
    let toastId = toast.loading("행사를 추가중입니다.");
    try {
      let duplicatedEventName = false;

      rows.forEach(event => {
        if (event.eventName === eventName) {
          toast.error('중복된 이름의 행사가 있습니다. \n다른 이름을 사용해주세요', {
            id: toastId,
            duration: 2000
          });
          duplicatedEventName = true;
          return;
        }
      });

      if (duplicatedEventName) {
        return;
      }

      const date = new Date();
      const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

      const newEvent = {
        eventName: eventName,
        created: formattedDate,
        modified: '없음',
      };

      const response = await fetch('/api/insert-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newEvent, id }),
      });

      if (response.status === 200) {
        const updatedUser = await response.json();
        storeInSession('user', JSON.stringify(updatedUser));
        setUserAuth(updatedUser);
        setRows(updatedUser.eventList.events || []);
        setEventName('');
        toast.success('행사를 생성했습니다.', {
          id: toastId,
          duration: 1000,
        });
      }else {
        const updatedUser = await response.json();
        toast.error(updatedUser.msg, {
          id: toastId,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('행사를 생성하는데 실패했습니다: ', {
        id: toastId,
        duration: 2000,
      });
    }
  };

  const confirmDeleteEvent = (eventName) => {
    confirmAlert({
        message: '선택된 행사를 삭제하시겠습니까?',
         buttons: [
            {
            label: '예',
            onClick: () => deleteEvent(eventName),
            },
            {
            label: '아니오',
            onClick: () => toast.dismiss(),
            },
        ],
    });
};

const deleteEvent = ( async (eventName) => {
  const toastId = toast.loading(`${eventName}을(를) 삭제중입니다.`);
  console.log(eventName)
  try {
      const response = await fetch(`/api/delete-event/${id}?eventName=${encodeURIComponent(eventName)}` , {
          method: 'DELETE',
      });

      if (!response.ok) {
          throw new Error('행사 삭제에 실패했습니다.');
      }
      const scoresAndTokenAndId = await response.json();
      storeInSession('user', JSON.stringify(scoresAndTokenAndId));
      storeInSession('data', JSON.stringify(scoresAndTokenAndId.scores));
      setUserAuth(scoresAndTokenAndId);
      setRows(scoresAndTokenAndId.eventList.events || []);
      toast.success(`${eventName}을(를) 삭제했습니다`, {
          id: toastId,
          duration: 2000, // 2초 동안 표시
      });    

  }catch (error) {
      toast.error('행사 삭제에 실패했습니다.', {
          id: toastId,
          duration: 2000 // 1초 동안 표시
      });
      console.error('Error:', error);
    }
});

const getEventData = async (eventName) => {
  try {
    const response = await fetch(`/api/get-event-data/${id}?eventName=${encodeURIComponent(eventName)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('행사 데이터를 가져오는데 실패했습니다.');
    }

    const eventData = await response.json();
    console.log(eventData)
    storeInSession('user', JSON.stringify(eventData));
    storeInSession('data', JSON.stringify(eventData.scores));
    setUserAuth(eventData);
    window.location.href = '/rank';
  } catch (error) {
    console.error('Error getting event data:', error);
  }
}

  return (
    <>
      {id && (
        <div className="pb-1">
          <MDBCard>
            <MDBCardBody>
              <div className="d-flex flex-row align-items-center justify-content-center gap-3">
                <input
                  type="text"
                  className="form-control form-control-lg w-8/12 md:w-5/12 text-base"
                  placeholder="행사 이름을 입력하세요."
                  style={{ fontSize: '16px' }}
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
                <button
                  onClick={() => addEvent()}
                  className="w-3/12 md:w-1/12 bg-ppink text-white px-2 py-2 rounded hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
                >
                  추가
                </button>
              </div>
            </MDBCardBody>
          </MDBCard>
        </div>
      )}
      <MDBListGroup className='px-3 md:px-6 md:mx-6' style={{ minWidth: '22rem' }} light>
        {rows.length === 0 ? (
          <MDBListGroupItem className='d-flex justify-content-between align-items-center'>
            <div>
              <div className='fw-bold'>행사가 없습니다.</div>
            </div>
            <MDBBadge pill light color='warning'>
              없음
            </MDBBadge>
          </MDBListGroupItem>
        ) : (
          rows.map((event, index) => (
            <MDBListGroupItem 
              key={index} 
              className={`d-flex px-4 justify-content-between align-items-center hover:bg-lightpink cursor-pointer `}
            >
              <div onClick={()=> getEventData(event.eventName)}>
                <div className='fw-bold'>{event.eventName}</div>
                <div className='text-muted'>생성일: {event.created}</div>
                <div className='text-muted'>최근 수정일: {event.modified}</div>
              </div>
              
              <div className='d-flex align-items-center pl-0.5'>
                <MDBBadge pill light color={event.modified === '없음' ? 'primary' : 'success'} className='fw-bold mr-2'>
                  {event.modified === '없음' ? '생성됨' : '수정됨'}
                </MDBBadge>
                <MDBTooltip
                    tag="a"
                    wrapperProps={{ href: "#!" }}
                >
                    <MDBIcon fas icon="trash-alt" style={{ color: "#D982BA", position: 'relative', top: '-2px' }} onClick={() => confirmDeleteEvent(event.eventName)}/>
                </MDBTooltip>
            </div>
            </MDBListGroupItem>
          ))
        )}
      </MDBListGroup>
    </>
  );
};

export default EventList;