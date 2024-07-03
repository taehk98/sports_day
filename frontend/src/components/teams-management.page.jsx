import React , { useContext, useState } from 'react';
import { UserContext } from '../App';
import { lookInSession, storeInSession } from '../common/session';
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

export function TeamList() {
    const [teamName, setTeamName] = useState('');
    const [isAscending, setIsAscending] = useState(true);
    const [checkedRows, setCheckedRows] = useState([]);
    const [scores, setScores] = useState(() => {
        return JSON.parse(lookInSession('data')); 
    });

    const {
        userAuth: { access_token },
        setUserAuth,
    } = useContext(UserContext);

    const [rows, setRows] = React.useState([
        ...scores
    ])

    // insert a team to scores
    async function insertTeam(newTeam, toastID) { 
        try {
            const response = await fetch('/api/insert-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTeam),
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            if (response.status === 200) {
                const scoresAndTokenAndId = await response.json();
                storeInSession('user', JSON.stringify(scoresAndTokenAndId));
                setUserAuth(scoresAndTokenAndId);
                storeInSession('data', JSON.stringify(scoresAndTokenAndId.scores));
                setRows(scoresAndTokenAndId.scores);
                setScores(scoresAndTokenAndId.scores);
                setTeamName('');
                toast.success('조를 추가했습니다.', {
                    id: toastID,
                    duration: 1000, // 2초 동안 표시
                });     
            }
        } catch (error) {
            toast.error('조를 추가하는데 실패했습니다.', {
                id: toastID,
                duration: 2000, // 3초 동안 표시
            });
        }
    }

    const addTeam = ( async () => {
        let id = toast.loading("조를 추가중입니다.");
        let duplicatName = false;
        let error = false;
        scores.forEach(team => {
            if(team.teamName == teamName) {
                toast.error('중복된 팀 아이디가 있습니다. \n다른 이름을 사용해주세요', {
                    id: id,
                    duration: 2000 // 1초 동안 표시
                });
                duplicatName = true;
                return;
            }
        })

        if (duplicatName) {
            return; // 함수 종료
        }
        let activityList = [];
        let activitiesObject = {};
        await fetch(`/api/get-activityList`)
            .then(response => {
                if (!response.ok) {
                throw new Error('Network response was not ok');
                }
                return response.json(); // JSON 데이터로 변환하여 반환
            })
            .then(data => {
                // 받아온 데이터를 처리
                activityList = data;
            })
            .catch(error => {
                // 오류 처리
                toast.error('조 추가에 실패했습니다', {
                    id: id,
                    duration: 2000 // 1초 동안 표시
                });
                console.error('There was a problem with the fetch operation:', error);
                error = true;
            });
        if (error) {
            return; // 함수 종료
        }

        activityList[0].activities.forEach(activity => {
            activitiesObject[activity] = 0;
        });

        let snack = [false, false, false, false, false];
        
        const newTeam = {
            teamName: teamName,
            totalScore: 0,
            participateNum: 0,
            activities: activitiesObject,
            snack: snack
        }

        await insertTeam(newTeam, id);
    });

    const deleteTeam = ( async (teamID, teamName) => {
        const id = toast.loading(`${teamName}조를 삭제중입니다.`);
        try {
            const response = await fetch(`/api/delete-team/${teamID}` , {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('조 삭제에 실패했습니다.');
            }
            const scoresAndTokenAndId = await response.json();
            storeInSession('user', JSON.stringify(scoresAndTokenAndId));
            storeInSession('data', JSON.stringify(scoresAndTokenAndId.scores));
            setUserAuth(scoresAndTokenAndId);
            setRows(scoresAndTokenAndId.scores);
            toast.success(`${teamName}조를 삭제했습니다`, {
                id: id,
                duration: 2000, // 2초 동안 표시
            });    

        }catch (error) {
            toast.error('조 삭제에 실패했습니다.', {
                id: id,
                duration: 2000 // 1초 동안 표시
            });
            console.error('Error:', error);
          }
    });

    const sortingList = () => {
        var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
        if (isAscending) {
            return [...rows].sort((a, b) => collator.compare(a.teamName, b.teamName));
        } else {
            return [...rows].sort((a, b) => collator.compare(b.teamName, a.teamName));
        }
    };
    
    const toggleSortOrder = () => {
        setIsAscending(!isAscending);
    };  

    const handleCheckboxChange = (rowId) => {
        // 체크박스가 체크되었는지 여부를 확인하고 상태를 업데이트합니다.
        if (checkedRows.includes(rowId)) {
            // 이미 체크된 경우 해당 rowId를 배열에서 제거합니다.
            setCheckedRows(checkedRows.filter(id => id !== rowId));
        } else {
            // 체크되지 않은 경우 해당 rowId를 배열에 추가합니다.
            setCheckedRows([...checkedRows, rowId]);
        }
    };

    const deleteCheckedTeams = async () => {
        const id = toast.loading(`선택된 조들을 삭제중입니다.`);
        try {
            const response = await fetch('/api/delete-multiple-teams' , {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checkedRows),
            });

            if (!response.ok) {
                throw new Error('선택된 항목을 삭제하는 데 실패했습니다.');
            }
            const scoresAndTokenAndId = await response.json();
            storeInSession('user', JSON.stringify(scoresAndTokenAndId));
            storeInSession('data', JSON.stringify(scoresAndTokenAndId.scores));
            setUserAuth(scoresAndTokenAndId);
            setRows(scoresAndTokenAndId.scores);
            setCheckedRows([]);
            toast.success(`선택된 조들을 삭제했습니다`, {
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

    const confirmDeleteCheckedTeams = () => {
        confirmAlert({
            message: '선택된 팀들을 삭제하시겠습니까?',
             buttons: [
                {
                label: '예',
                onClick: () => deleteCheckedTeams(),
                },
                {
                label: '아니오',
                onClick: () => toast.dismiss(),
                },
            ],
        });
    };

    const confirmDeleteTeam = (teamID, teamName) => {
        confirmAlert({
            message:  `${teamName}조를 삭제하시겠습니까?`,
            buttons: [
                {
                    label: '예',
                    onClick: () => deleteTeam(teamID, teamName),
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
        const {row, index, length} = props;
        return (
            <MDBListGroup horizontal className="rounded-0 bg-transparent">
                        <MDBListGroupItem className="d-flex align-items-center ps-0 pe-3 py-1 rounded-0 border-0 bg-transparent">
                        <MDBCheckbox
                            name="flexCheck"
                            value=""
                            id={`flexCheck-${index}`}
                            onChange={() => handleCheckboxChange(row._id)} // 체크박스 클릭 시 이벤트 핸들러 추가
                            checked={checkedRows.includes(row._id)} // 체크 상태 설정
                        />
                        </MDBListGroupItem>
                        <MDBListGroupItem className="px-3 py-1 d-flex align-items-center flex-grow-1 border-0 bg-transparent">
                        {" "}
                        <p className="lead fw-normal mb-0">{row.teamName}조</p>
                        </MDBListGroupItem>
                        <MDBListGroupItem className="px-3 py-1 d-flex align-items-center border-0 bg-transparent pr-1">
                        <div className="px-2 me-2 border-1 border-ppink rounded-3 d-flex align-items-center bg-light">
                            <p className="medium mb-0">
                            <MDBTooltip
                                tag="a"
                                wrapperProps={{ href: "#!" }}
                                title="Due on date"
                            >
                            </MDBTooltip>
                            ({row.participateNum}/{length})
                            
                            </p>
                        </div>
                        </MDBListGroupItem>
                        <MDBListGroupItem className="ps-3 pe-0 py-1 rounded-0 border-0 bg-transparent">
                        <div className="d-flex flex-row justify-content-end mb-1 mr-6 pr-2">
                            {/* <MDBTooltip
                                tag="a"
                                wrapperProps={{ href: "#!" }}
                                title="Edit todo"
                            >
                                <MDBIcon
                                    fas
                                    icon="pencil-alt"
                                    className="me-3"
                                    color="info"
                                />
                            </MDBTooltip> */}
                            <MDBTooltip
                                tag="a"
                                wrapperProps={{ href: "#!" }}
                                title="Delete todo"
                            >
                                <MDBIcon fas icon="trash-alt" color="danger" onClick={() => confirmDeleteTeam(row._id, row.teamName)}/>
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
                            <u className='font-bold text-3xl no-underline'>조 관리</u>
                        </p>
                        <div className="pb-1">
                            <MDBCard>
                                <MDBCardBody>
                                    <div className="d-flex flex-row align-items-center">
                                        <input
                                            type="text"
                                            className="form-control form-control-lg w-9/12 md:w-11/12 text-base"
                                            id="exampleFormControlInput1"
                                            placeholder="예시) 1조 -> 1"
                                            style={{ fontSize: '16px'}}
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                        />
                                        <button onClick={() => addTeam()} className="w-3/12 md:w-1/12 bg-ppink text-white px-3 py-2 rounded hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50">
                                            추가
                                        </button>
                                    </div>
                                </MDBCardBody>
                            </MDBCard>
                        </div>
                        <hr className="my-4" />
                        <div className="d-flex align-items-center mb-2 pt-2 justify-content-between px-4">
                            <div className='pl-0.5'>
                                <MDBTooltip
                                    tag="a"
                                    wrapperProps={{ href: "#!" }}
                                    title="Delete todo"
                                >
                                    <MDBIcon fas icon="trash-alt" style={{ color: "#D982BA" }} onClick={() => confirmDeleteCheckedTeams()}/>
                                </MDBTooltip>
                            </div>
                            <div className="d-flex align-items-center">
                                <p className="small mb-0 me-4 text-muted">(참여/총활동)</p>
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
                            {sortedList.map((team, index) => (
                                <Row key={team.teamName} row={team} index={index} length={Object.values(sortedList[index].activities).length}/>
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