import React , { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { storeInSession, lookInSession } from '../common/session';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons'
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export function CollapsibleTable() {
    const [scores, setScores] = useState(() => {
        return JSON.parse(lookInSession('data')); 
    });

    async function fetchData() {
        let id = toast.loading("순위를 가져오는중입니다...");
        try {
            const response = await fetch('/api/get-scores');
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            if (response.status === 200) {
                const scoresAndTokenAndId = await response.json();
                storeInSession('data', JSON.stringify(scoresAndTokenAndId.scores));
                setScores(scoresAndTokenAndId.scores)
                setRows(scoresAndTokenAndId.scores);
                toast.success('순위를 가져왔습니다.', {
                    id: id,
                    duration: 1000, // 2초 동안 표시
                });     
            }
        } catch (error) {
            toast.error('점수를 불러오는데 실패했습니다.', {
                id: id,
                duration: 2000, // 3초 동안 표시
            });
        }
    }

    useEffect(()=> {
        fetchData()
        // 저장한거 쓰려면 !scores일때만 하게 하면됨
    }, [])

    let newDataArray = [];

    useEffect(() => {
        if(scores !== undefined && scores !== null){
            for (const scoreObj of Object.values(scores)) {
                const { teamName, participateNum, totalScore, activities } = scoreObj;
                newDataArray.push(createData(teamName, participateNum, totalScore, activities));
            }
            setTotalNum(Object.keys(scores[0]['activities']).length);
            newDataArray = [...newDataArray].sort((a, b) => b.totalScore - a.totalScore);
            setRows(newDataArray);
            setClicked('totalScore');
            setSortByTotalScore(true);
            setSortByParticipateNum(null);
            setRankingOrder(false);

        }
    }, [scores])

    const [totalNum, setTotalNum] = useState(20);
    const [rows, setRows] = useState([]);
    const [sortByTotalScore, setSortByTotalScore] = useState(null);
    const [sortByParticipateNum, setSortByParticipateNum] = useState(null);
    const [rankingOrder, setRankingOrder] = useState(null);
    const [clicked, setClicked] = useState(null);
 
    const handleSortByTotalScore = () => {
        const sortedRows = [...rows].sort((a, b) => b.totalScore - a.totalScore);
        setRows(sortByTotalScore ? sortedRows.reverse() : sortedRows);
        setSortByTotalScore(!sortByTotalScore);
        setSortByParticipateNum(null);
        setClicked('totalScore');
        if(sortByTotalScore) {
            setRankingOrder(true);
        } else {
            setRankingOrder(false);
        }
    };

    const handleSortByParticipateNum = () => {
        const sortedRows = [...rows].sort((a, b) => (b.participateNum / totalNum) - (a.participateNum / totalNum));
        setRows(sortByParticipateNum ? sortedRows.reverse() : sortedRows);
        setSortByParticipateNum(!sortByParticipateNum);
        setSortByTotalScore(null);
        setClicked('participateNum');
        if(sortByParticipateNum) {
            setRankingOrder(true);
        } else {
            setRankingOrder(false);
        }
    };

    function createData(teamName, participateNum, totalScore, activities) {
    return {
        teamName,
        participateNum,
        totalScore,
        activities
    };
    }


    let isChromeForiOS = false;

    var ua = window.navigator.userAgent;
    let iOS = ua.match(/Macintosh/i) || ua.match(/iPad/i) || ua.match(/iPhone/i);
    var webkit = ua.match(/WebKit/i);
    var iOSSafari = iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/EdgiOS/i) && !ua.match(/Chrome/i) && !ua.match(/Edg/i);

    let userAgentString =  
                navigator.userAgent; 
          
    // Detect Chrome 
    let chromeAgent =  
        userAgentString.indexOf("Chrome") > -1; 
  
      if (iOSSafari && !chromeAgent) {
        isChromeForiOS = true;
      }
    

    // const isChromeOnAndroid = /Chrome\/[.0-9]* Mobile/.test(navigator.userAgent) && /Android/.test(navigator.userAgent);

function Row(props) {
    const { row, index } = props;
    const [open, setOpen] = React.useState(false);
    let ranking;
    let currScore;
    if(clicked === 'totalScore') {
        currScore = rows[index].totalScore;
        if (rankingOrder === false) {
            ranking = index + 1;
            for(let i = index; i > 0; i--) {
                if (currScore === rows[i-1].totalScore) {
                    ranking = i;
                } else {   
                    break;
                }
            }
            if(index === 0) {
                ranking = 1;
            }
        } else if (rankingOrder === true) {
            ranking = rows.length - index;
            for(let i = index; i < rows.length -1; i++) {
                if (currScore === rows[i + 1].totalScore) {
                    ranking = ranking - 1;
                } else {
                    break;
                }
            }
        }
    } else if (clicked === 'participateNum') {
        currScore = rows[index].participateNum;
        if (rankingOrder === false) {
            ranking = index + 1;
            for(let i = index; i > 0; i--) {
                if (currScore === rows[i-1].participateNum) {
                    ranking = i;
                } else {   
                    break;
                }
            }
            if(index === 0) {
                ranking = 1;
            }
        } else if (rankingOrder === true) {
            ranking = rows.length - index;
            for(let i = index; i < rows.length -1; i++) {
                if (currScore === rows[i + 1].participateNum) {
                    ranking = ranking - 1;
                } else {
                    break;
                }
            }
        }
    }
  return (
    <React.Fragment>
        <TableRow style={{
            backgroundColor: index % 2 !== 0 ? '#FFEFEF' : 'transparent',
            }} sx={{ '& > *': { borderBottom: 'unset' }}} 
        >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)} 
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" align="center" style={{ fontSize: '15px'}}>
             {ranking}등
        </TableCell>
        <TableCell align="center" style={{ fontSize: '15px'}} >{row.teamName}조</TableCell>
        <TableCell align="center" style={{ fontSize: '15px'}} >{row.participateNum} / {totalNum}</TableCell>
        <TableCell align="center" style={{ fontSize: '15px'}} >{row.totalScore}점</TableCell>
      </TableRow>
      <TableRow style={{ backgroundColor: index % 2 !== 0 ? '#FFEFEF' : 'transparent' }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 0 }}>
              <Typography variant="h6" gutterBottom component="div" className='pt-1'>
                활동별 점수
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                <TableRow className={index % 2 !== 0 ? 'bg-white rounded-lg' : 'bg-orange rounded-lg'}>
                    <TableCell align="center" style={{ fontFamily: 'Inter', fontSize: '13px'}}>활동명</TableCell>
                    <TableCell align="center" style={{ fontFamily: 'Inter' , fontSize: '13px'}}>점수</TableCell>
                    <TableCell align="center" style={{ fontFamily: 'Inter' , fontSize: '13px'}}>활동명</TableCell>
                    <TableCell align="center" style={{ fontFamily: 'Inter' , fontSize: '13px'}}>점수</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {row.activities && Object.entries(row.activities).map(([activityName, score], index) => (
                    index % 2 === 0 ? (
                        // 짝수 번째 활동인 경우
                        <TableRow key={index}  style={{ fontSize: '13px', fontFamily: 'Inter'}}>
                            <TableCell component="th" scope="row" align="center" style={{ fontSize: '13px', fontFamily: 'Inter'}}>
                                {activityName}
                            </TableCell>
                            <TableCell align="center"  style={{ fontSize: '13px', fontFamily: 'Inter'}}>{score}</TableCell>
                            {/* 다음 홀수 번째 활동이 있는지 확인하고 있으면 렌더링 */}
                            {index + 1 < Object.entries(row.activities).length && (
                                <TableCell component="th" scope="row" align="center" style={{ fontSize: '13px', fontFamily: 'Inter'}}>
                                    {Object.entries(row.activities)[index + 1][0]}
                                </TableCell>
                            )}
                            {/* 다음 홀수 번째 활동의 점수가 있는지 확인하고 있으면 렌더링 */}
                            {index + 1 < Object.entries(row.activities).length && (
                                <TableCell align="center" style={{ fontSize: '13px', fontFamily: 'Inter'}}>
                                    {Object.entries(row.activities)[index + 1][1]}
                                </TableCell>
                            )}
                        </TableRow>
                    ) : null
                ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}
// 'calc(100vh - 80px)'

  return (
    <>  
        <div>
        <Toaster/>
        <div className='text-2xl rounded font-bold text-center py-2 mx-2 bg-pink-100 flex justify-center relative'>
            <span >실시간 순위표</span>
            <FontAwesomeIcon icon={faArrowsRotate} onClick={fetchData} className="absolute right-0 top-1/2 transform -translate-y-1/2 pr-2" />
        </div>
        <div className='mx-2'>
        <TableContainer component={Paper} className='bg-bgColor' sx={{ width: '100%', zIndex: 20}}>
        <Table aria-label="collapsible table" style={{ maxWidth: '100%' }} sx={{ minWidth: 350, zIndex: 20}} size="small">
            <TableHead className='bg-ppink'>
            <TableRow 
                sx={{
                    color: 'white',
                }}>
                <TableCell />
                <TableCell align="center" style={{ color: 'white', fontWeight: 'bold' }}>순위</TableCell>
                <TableCell align="center"style={{ color: 'white', fontWeight: 'bold' }}>조</TableCell>
                <TableCell align="center" style={{ color: 'white', fontWeight: 'bold' }}>
                    <button onClick={handleSortByParticipateNum} style={{ color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                        {!sortByParticipateNum ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon/>}
                        참여/총
                    </button>
                </TableCell>
                <TableCell align="center" style={{ color: 'white', fontWeight: 'bold' }}>
                    <button onClick={handleSortByTotalScore} style={{ color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                        {!sortByTotalScore ? <KeyboardArrowUpIcon/> :  <KeyboardArrowDownIcon />}
                        총점
                    </button>
                </TableCell>
            </TableRow>
            </TableHead>
            <TableBody >
            {rows.map((row, index) => (
                <Row key={`${row.teamName}-${index}`} row={row} index={index} length={rows.length}/>
            ))}
            </TableBody>
        </Table>
        </TableContainer>
        </div>
        </div>
    </>  
  );
}