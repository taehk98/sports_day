const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const DB = require('./database.js');
const cors = require('cors');
const axios = require("axios");
const path = require("path");
// const { peerProxy } = require('./peerProxy.js');
const app = express();
const Joi = require('joi');

const port = process.argv.length > 2 ? process.argv[2] : 3000;
const authCookieName = 'token';
let scores = [];
let userID = '';


app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// app.use(express.static('frontend'));
app.use(express.static('public'));

app.use(cors());

// Trust headers that are forwarded from the proxy so we can determine IP addresses
app.set('trust proxy', true);

var apiRouter = express.Router();
app.use(`/api`, apiRouter);

app.use(function (err, req, res, next) {
    res.status(500).send({ type: err.name, message: err.message });
  });

const loginSchema = Joi.object({
    id: Joi.string().required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,}$')).required()
});

const eventSchema = Joi.object({
    eventName: Joi.string().pattern(new RegExp('^[a-zA-Z0-9가-힣 ]+$')).required(),
    created: Joi.string().regex(/^\d{4}\/\d{2}\/\d{2}$/).required(),
    modified: Joi.alternatives().try(
        Joi.string().valid('없음'), // Validating for '없음'
        Joi.string().regex(/^\d{4}\/\d{2}\/\d{2}$/).required() // Validating for yyyy/mm/dd format
      ).required()
});

apiRouter.post('/auth/create', async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
        // 유효성 검사 실패 시 클라이언트에게 오류 응답 반환
        return res.status(400).send({ msg: '비밀번호는 8자 이상의 영문자로 입력해주세요.', details: error.details });
    }
    try {
        let user = await DB.getAdmin(value.id);

        if (user) {
            return res.status(409).send({ msg: '같은 아이디의 유저가 이미 존재합니다.' });
        } 
    
        user = await DB.createUser(value.id, value.password);
        // Set the cookie
        const eventList = await DB.getEventList(value.id);
        const scores = await DB.initialScores();
        const accessToken = uuidv4();
        setAuthCookie(res, accessToken);
        await DB.setAdminToken(value.id, accessToken);

        return res.status(200).send({ scores, eventList: eventList, access_token: accessToken, id: value.id });
    } catch (err) {
        console.error('아이디 생성 중 오류:', err);
        return res.status(500).send({ msg: '서버 오류: 아이디 생성을 처리하는 도중에 문제가 발생했습니다.' });
    }
    
});

apiRouter.post('/auth/login', async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
        // 유효성 검사 실패 시 클라이언트에게 오류 응답 반환
        return res.status(400).send({ msg: '비밀번호는 8자 이상의 문자로 입력해주세요.', details: error.details });
      }
    
    try {
        // 사용자 조회
        const user = await DB.getAdmin(value.id);
        const eventList = await DB.getEventList(value.id);

        if (!user) {
            return res.status(401).send({ msg: '로그인 실패: 아이디 또는 비밀번호를 다시 확인해주세요.' });
        }

        // 비밀번호 비교
        const passwordMatch = await bcrypt.compare(value.password, user.password);

        if (!passwordMatch) {
            return res.status(401).send({ msg: '로그인 실패: 아이디 또는 비밀번호를 다시 확인해주세요.' });
        }

        // 인증 성공 시 초기 점수 및 액세스 토큰 생성 및 전송
        const scores = await DB.initialScores();
        const accessToken = uuidv4();
        setAuthCookie(res, accessToken);
        await DB.setAdminToken(value.id, accessToken);

        return res.status(200).send({ scores, eventList: eventList, access_token: accessToken, id: value.id });
    } catch (err) {
        console.error('로그인 중 오류:', err);
        return res.status(500).send({ msg: '서버 오류: 로그인을 처리하는 도중에 문제가 발생했습니다.' });
    }
});

  // DeleteAuth token if stored in cookie
apiRouter.delete('/auth/logout', async (req, res) => {
    const authToken = req.cookies[authCookieName];
    try {
        const tokenRemoved = await DB.deleteUserToken(authToken);
        if (tokenRemoved) {
            res.clearCookie(authCookieName);
            userID = null;
            res.status(204).end();
        } else {
            res.status(400).send({ msg: 'Failed to remove token' });
        }
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(400).send({ msg: '로그아웃 중 오류가 발생했습니다.' });
    }
});

apiRouter.get('/get-scores', async (req, res) => {
    try {
        const scores = await DB.initialScores();
        authToken = await req.cookies[authCookieName];
        authToken = authToken ? authToken : null;
        userID = userID ? userID : null;
        res.status(200).send({ scores: scores, access_token: authToken, id: userID })
    }
    catch {
        res.status(400).end();
    }
})

// secureApiRouter verifies credentials for endpoints
var secureApiRouter = express.Router();
apiRouter.use(secureApiRouter);

secureApiRouter.use(async (req, res, next) => {
    authToken = req.cookies[authCookieName];
    const user = await DB.getUserByToken(authToken);
    if (user) {
        next();
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
    });

secureApiRouter.get('/get-activityList', async (req, res) => {
    try {
        const activities = await DB.getActivityList();
        res.status(200).send(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).send({ msg: 'Failed to fetch activities' });
    }
});

secureApiRouter.post('/update-snack', async (req, res) => {
    try{
        const { snack, teamName } = req.body;
        authToken = req.cookies[authCookieName];
        await DB.updateSnack(req, res, snack, teamName);
        res.status(200).send();
    } catch(err) {
        res.status(400).send();
    }
})

secureApiRouter.post('/insert-team', async (req, res) => {
    try {
        authToken = req.cookies[authCookieName];
        const scores = await DB.insertTeam(req.body);
        res.status(200).send({scores: scores , access_token: authToken , id: 'admin'});
    } catch(err) {
        res.status(400)
    }
});

secureApiRouter.delete('/delete-team/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID format');
    }

    try {
        const scores = await DB.deleteTeam(id);
        authToken = req.cookies[authCookieName];
        res.status(200).send({scores: scores , access_token: authToken , id: 'admin'});
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while trying to delete the document');
    }
});

secureApiRouter.post('/insert-event', async (req, res) => {
    const { error, value } = eventSchema.validate(req.body.newEvent);

    if (error) {
        // 유효성 검사 실패 시 클라이언트에게 오류 응답 반환
        return res.status(400).send({ msg: '행사이름을 숫자와 문자 조합으로 만들어주세요.', details: error.details });
    }

    try {
        authToken = req.cookies[authCookieName];
        const eventList = await DB.insertEvent(value, req.body.id );
        return res.status(200).send({eventList: eventList, access_token: authToken , id: req.body.id});
    } catch(err) {
        return res.status(400).send({ msg: '서버 오류가 발생했습니다.'});
    }
});

secureApiRouter.delete('/delete-event/:id', async (req, res) => {
    const { id } = req.params;
    const { eventName } = req.query;

    try {
        const eventList = await DB.deleteEvent(eventName, id);
        authToken = req.cookies[authCookieName];
        res.status(200).send({eventList: eventList , access_token: authToken , id: id});
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while trying to delete the event');
    }
});

secureApiRouter.get('/get-event-data/:id', async (req, res) => {
    const { id } = req.params;
    const { eventName } = req.query;
    
    try {
        const scores = await DB.getEventScores(eventName, id);
        const authToken = req.cookies[authCookieName] || null;
        
        res.status(200).send({ scores: scores, access_token: authToken, id: id });
    } catch (error) {
        console.error('Error fetching event data:', error);
        res.status(400).end();
    }
});

secureApiRouter.delete('/delete-multiple-teams', async (req, res) => {
    const teamIDs = req.body;
    try{
        const scores = await DB.deleteMultipleTeams(teamIDs);
        authToken = req.cookies[authCookieName];
        res.status(200).send({scores: scores, access_token: authToken , id: 'admin'});
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while trying to delete the document');
    }
})

secureApiRouter.put('/update-score-by-activity', async (req, res) => {
    try {
        const { activityId, teamName, newScore } = req.body;
        const updatedScores = await DB.updateScoresByActivity(activityId, teamName, newScore);
        if (newScore > 15) {
            res.status(500).send({ msg: 'Failed to update score' });
        }
        authToken = req.cookies[authCookieName];
        res.status(200).send({updatedScores: updatedScores , access_token: authToken , id: 'admin'});
    } catch (err) {
        console.error('Error updating score by activity:', err);
        res.status(500).send({ msg: 'Failed to update score' });
    }
});

secureApiRouter.get('/teams', async (req, res) => {
    try {
        const teams = await DB.getTeamNamesFromScores();
        res.status(200).send(teams);
    } catch (error) {
        console.error('Error fetching team names:', error);
        res.status(500).send({ msg: 'Failed to fetch team names' });
    }
});
secureApiRouter.get('/get-activities', async (req, res) => {
    try {
        const activities = await DB.getActivities();
        res.status(200).send(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).send({ msg: 'Failed to fetch activities' });
    }
});
secureApiRouter.get('/get-numActivity', async (req, res) => {
    try {
        const numActivity = await DB.getNumActsFromScores();
        res.status(200).send(numActivity);
    } catch (error) {
        console.error('Error fetching participateNum:', error);
        res.status(500).send({ msg: 'Failed to fetch participateNum' });
    }
});
secureApiRouter.get('/get-score-and-participation', async (req, res) => {
    try {
        const { teamName, activityId } = req.query;

        if (!teamName) {
            return res.status(400).send({ msg: 'Invalid input data' });
        }

        const team = await DB.getTeam(teamName);
        console.log(team)
        if (!team) {
            return res.status(404).send({ msg: 'Team not found' });
        }

        const score = team.activities[activityId] || 0;
        const participateNum = team.participateNum || 0; // Assuming participateNum is stored at the team level
        const snack = team.snack;

        res.status(200).send({ score, participateNum, snack });
    } catch (err) {
        console.error('Error fetching score and participation:', err);
        res.status(500).send({ msg: 'Failed to fetch score and participation' });
    }
});

secureApiRouter.delete('/delete-multiple-activities', async (req, res) => {
    const activityNames = req.body;
    try{
        const activityList = await DB.deleteMultipleActivities(activityNames);
        authToken = req.cookies[authCookieName];
        res.status(200).send({activityList: activityList , access_token: authToken , id: 'admin'});
    }catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while trying to delete the document');
    }
})

secureApiRouter.post('/insert-activity', async (req, res) => {
    try {
        authToken = req.cookies[authCookieName];
        const activityList = await DB.insertActivity(req.body.activityName);
        const scores = await DB.initialScores();
        res.status(200).send({access_token: authToken , id: 'admin', scores: scores, activityList: activityList });
    } catch(err) {
        res.status(400).send(err.message);
    }
});

secureApiRouter.delete('/delete-activity/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const activityList = await DB.deleteActivity(id);
        authToken = req.cookies[authCookieName];
        res.status(200).send({activityList: activityList , access_token: authToken , id: 'admin'});
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while trying to delete the document');
    }
});

///////////////////////////////////////////// manageyourclub below

//used for one attendance change
secureApiRouter.post('/save-attendance', async (req, res) => {
    await DB.updateAttendances(req.body, attendances);
    attendances = await DB.initialClubAttds(req.body.club, attendances);
    res.send(attendances);
})

// used for 
secureApiRouter.post('/replace-attendances', async (req, res) => {
    attendances = await DB.replaceAttentances(req.body, attendances);
    attendances = await DB.initialClubAttds(req.body.club, attendances);
    res.send(attendances);
})

secureApiRouter.post('/attendances', async (req, res) => {
    try {
        const user = await DB.getAttendance(req.body.email);
        const updatedAttendances = await DB.initialClubAttds(user.club, attendances);
        res.send(updatedAttendances);
    } catch (error) {
        console.error('Error while fetching attendances:', error);
        res.status(500).json({ error: 'Failed to fetch attendances' });
    }
});

app.use((_req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, 'public') });
  });

const httpService = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });

// peerProxy(httpService);

async function addUserToAttds(email, attendances) {
    const attd = await DB.getAttendance(email);
    if (attd) {
        if (!attendances) {
            attendances = []; // 만약 비어있으면 빈 배열을 생성합니다.
        }
        attendances.push(attd);
    } else {
        console.error(`Attendance information not found for email: ${email}`);
    }
    return attendances;
}

// setAuthCookie in the HTTP response
function setAuthCookie(res, authToken) {
    res.cookie(authCookieName, authToken, {
      secure: false,
      httpOnly: true,
      sameSite: 'strict',
    });
  }
