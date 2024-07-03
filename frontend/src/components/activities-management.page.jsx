import React , { useContext, useState, useEffect } from 'react';
import { UserContext } from '../App';
import { storeInSession } from '../common/session';
import { Toaster, toast } from 'react-hot-toast';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css';
import {
  MDBCard,
  MDBCardBody,
  MDBCheckbox,
  MDBCol,
  MDBContainer,
  MDBIcon,
  MDBListGroup,
  MDBListGroupItem,
  MDBRow,
  MDBTooltip,
} from "mdb-react-ui-kit";

export function ActivityList() {
    const [activityName, setActivityName] = useState('');
    const [activityList, setActivityList] = useState([]);
    const [isAscending, setIsAscending] = useState(true);
    const [checkedRows, setCheckedRows] = useState([]);

    const {
        userAuth: { access_token, scores },
        setUserAuth,
    } = useContext(UserContext);

    async function getActivityList() {
        await fetch(`/api/get-activityList`)
            .then(response => {
                if (!response.ok) {
                throw new Error('Network response was not ok');
                }
                return response.json(); // JSON 데이터로 변환하여 반환
            })
            .then(data => {
                // 받아온 데이터를 처리
                setActivityList(data[0].activities);
            })
            .catch(error => {
                // 오류 처리
                toast.error('활동리스트를 가져오는데 실패했습니다.', {
                    duration: 2000 // 1초 동안 표시
                });
                console.error('There was a problem with the fetch operation:', error);   
            });
    }

    useEffect(() => {
        // Call sorting function when the component mounts
        async function fetchActivity() {
            await getActivityList();
        }
        fetchActivity();
    }, []);

    // insert an activity
    async function insertActivity(toastID) { 
        try {
            const response = await fetch(`/api/insert-activity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({activityName: activityName})
            });
    
            if (response.status === 200) {
                const scoresAndTokenAndId = await response.json();
                storeInSession('data', JSON.stringify(scoresAndTokenAndId.scores));
                setActivityList(scoresAndTokenAndId.activityList[0].activities);
                setActivityName('');
                toast.success('활동을 추가했습니다.', {
                    id: toastID,
                    duration: 2000, // 2초 동안 표시
                });     
            }
            else {
                throw new Error('Network response was not ok');
            }
        } catch (error) {
            toast.error('활동을 추가하는데 실패했습니다.', {
                id: toastID,
                duration: 2000, // 3초 동안 표시
            });
        }
    }

    const addActivity = ( async () => {
        let id = toast.loading("활동을 추가중입니다.");
        let duplicateName = false;

        if (!activityList) {
            await getActivityList();
        }

        activityList.forEach(activity => {
            if(activity === activityName) {
                toast.error('중복된 활동이 있습니다. \n다른 이름을 사용해주세요', {
                    id: id,
                    duration: 2000 // 1초 동안 표시
                });
                duplicateName = true;
                return;
            }
        })

        if (duplicateName) {
            return; // 함수 종료
        }

        await insertActivity(id);
    });

    const deleteActivity = ( async (activityName) => {
        const id = toast.loading(`${activityName}을(를) 삭제중입니다.`);
        try {
            const response = await fetch(`/api/delete-activity/${activityName}` , {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('해당 활동 삭제에 실패했습니다.');
            }
            const scoresAndTokenAndId = await response.json();
            storeInSession('user', JSON.stringify(scoresAndTokenAndId));
            setUserAuth(scoresAndTokenAndId);
            setActivityList(scoresAndTokenAndId.activityList[0].activities);
            toast.success(`${activityName}을(를) 삭제했습니다`, {
                id: id,
                duration: 2000, // 2초 동안 표시
            });    

        }catch (error) {
            toast.error('해당 활동 삭제에 실패했습니다.', {
                id: id,
                duration: 2000 // 1초 동안 표시
            });
            console.error('Error:', error);
          }
    });

    const sortingList = () => {
        var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
        if (isAscending) {
            return activityList.sort((a, b) => collator.compare(a, b));
        } else {
            return activityList.sort((a, b) => collator.compare(b, a));
        }
    };
    
    const toggleSortOrder = () => {
        setIsAscending(!isAscending);
    };  

    const handleCheckboxChange = (rowActivityName) => {
        // 체크박스가 체크되었는지 여부를 확인하고 상태를 업데이트합니다.
        if (checkedRows.includes(rowActivityName)) {
            // 이미 체크된 경우 해당 rowId를 배열에서 제거합니다.
            setCheckedRows(checkedRows.filter(activity => activity !== rowActivityName));
        } else {
            // 체크되지 않은 경우 해당 rowId를 배열에 추가합니다.
            setCheckedRows([...checkedRows, rowActivityName]);
        }
    };

    const deleteCheckedActivities = async () => {
        const id = toast.loading(`선택된 활동들을 삭제중입니다.`);
        try {
            const response = await fetch('/api/delete-multiple-activities' , {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checkedRows),
            });

            if (!response.ok) {
                throw new Error('선택된 항목을 삭제하는데 실패했습니다.');
            }
            const scoresAndTokenAndId = await response.json();
            storeInSession('user', JSON.stringify(scoresAndTokenAndId));
            setUserAuth(scoresAndTokenAndId);
            setActivityList(scoresAndTokenAndId.activityList[0].activities);
            setCheckedRows([]);
            toast.success(`선택된 활동들을 삭제했습니다`, {
                id: id,
                duration: 2000, // 2초 동안 표시
            });    

        }catch (error) {
            toast.error('선택된 항목을 삭제하는 데 실패했습니다.', {
                id: id,
                duration: 2000 // 1초 동안 표시
            });
          }
    }

    const confirmDeleteCheckedActivities = () => {
        confirmAlert({
            message: '선택된 활동들을 삭제하시겠습니까?',
             buttons: [
                {
                label: '예',
                onClick: () => deleteCheckedActivities(),
                },
                {
                label: '아니오',
                onClick: () => toast.dismiss(),
                },
            ],
        });
    };

    const confirmDeleteActivity = (activityName) => {
        confirmAlert({
            message:  `${activityName}를(을) 삭제하시겠습니까?`,
            buttons: [
                {
                    label: '예',
                    onClick: () => deleteActivity(activityName),
                },
                {
                    label: '아니오',
                    onClick: () => toast.dismiss(),
                },
            ],
        });    
    }

    const sortedList = sortingList();

    function Row(props) {
        const {row, index} = props;
        return (
            <MDBListGroup horizontal className="rounded-0 bg-transparent">
                        <MDBListGroupItem className="d-flex align-items-center ps-0 pe-3 py-1 rounded-0 border-0 bg-transparent">
                        <MDBCheckbox
                            name="flexCheck"
                            value=""
                            id={`flexCheck-${index}`}
                            onChange={() => handleCheckboxChange(row)} // 체크박스 클릭 시 이벤트 핸들러 추가
                            checked={checkedRows.includes(row)} // 체크 상태 설정
                        />
                        </MDBListGroupItem>
                        <MDBListGroupItem className="px-3 py-1 d-flex align-items-center flex-grow-1 border-0 bg-transparent">
                        {" "}
                        <p className="lead fw-normal mb-0">{row}</p>
                        </MDBListGroupItem>
                        <MDBListGroupItem className="ps-3 pe-0 py-1 rounded-0 border-0 bg-transparent">
                        <div className="d-flex flex-row justify-content-end mb-1 mr-6 pr-2">
                            <MDBTooltip
                                tag="a"
                                wrapperProps={{ href: "#!" }}
                                title="Delete todo"
                            >
                                <MDBIcon fas icon="trash-alt" color="danger" onClick={() => confirmDeleteActivity(row)}/>
                            </MDBTooltip>
                        </div>
                </MDBListGroupItem>
            </MDBListGroup>
        )
    };

    return (
        <>
        {access_token && (
            <MDBContainer className="py-2 overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
            <MDBRow className="d-flex justify-content-center align-items-center">
                <MDBCol>
                    <MDBCard
                        id="list1"
                        style={{ borderRadius: ".75rem", backgroundColor: "#FFE6E6" }}
                    >
                        <MDBCardBody className="py-2 px-3 px-md-5">
                            <p className="  text-center py-2 ">
                                <u className='font-bold text-3xl no-underline'>활동 관리</u>
                            </p>
                            <div className="pb-1">
                                <MDBCard>
                                    <MDBCardBody>
                                        <div className="d-flex flex-row align-items-center">
                                            <input
                                                type="text"
                                                className="form-control form-control-lg w-9/12 md:w-11/12 text-base"
                                                style={{ fontSize: '16px'}}
                                                id="exampleFormControlInput1"
                                                placeholder="활동 이름을 입력하세요..."
                                                value={activityName}
                                                onChange={(e) => setActivityName(e.target.value)}
                                            />
                                            <button onClick={() => addActivity()} className="w-3/12 md:w-1/12 bg-ppink text-white px-3 py-2 rounded hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50">
                                                추가
                                            </button>
                                        </div>
                                    </MDBCardBody>
                                </MDBCard>
                            </div>
                            <hr className="my-4" />
                            <div className="d-flex align-items-center mb-2 pt-2 pb-1 justify-content-between mx-4">
                                <div className='pl-0.5'>
                                    <MDBTooltip
                                        tag="a"
                                        wrapperProps={{ href: "#!" }}
                                        title="Delete todo"
                                    >
                                        <MDBIcon fas icon="trash-alt" style={{ color: "#D982BA" }} onClick={() => confirmDeleteCheckedActivities()}/>
                                    </MDBTooltip>
                                </div>
                                <div className="d-flex align-items-center">
                                    <p className="small mb-0  text-muted">정렬</p>
                                    <MDBTooltip
                                        tag="a"
                                        wrapperProps={{ href: "#!" }}
                                        title="Ascending"
                                    >
                                        <MDBIcon
                                            fas
                                            icon="sort-amount-down-alt"
                                            className="ms-2"
                                            style={{ color: "#23af89" }}
                                            onClick={() => toggleSortOrder()}
                                        />
                                    </MDBTooltip>
                                </div>
                            </div>
                            <MDBCardBody className='' style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                                {activityList.map((activity, index) => (
                                    <Row key={activity} row={activity} index={index}/>
                                ))}
                            </MDBCardBody>
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