const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const DB = require('./database.js');
const cors = require('cors');
const path = require("path");
const admin = require('firebase-admin');
const serviceAccount = require('./sportsday-428323-firebase-adminsdk-tec1p-fbbf21013c.json');
const { getAuth } = require('firebase-admin/auth');
// const { peerProxy } = require('./peerProxy.js');
const app = express();
const { loginSchema, eventSchema, teamNameSchema } = require('./schema.js');

const port = process.argv.length > 2 ? process.argv[2] : 3000;
const authCookieName = 'token';
let scores = [];
let userID = '';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });


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

apiRouter.post('/auth/create', async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
        // Joi 유효성 검사 실패 시 클라이언트에게 오류 응답 반환
        const errorMessage = error.details.map(detail => detail.message.replace(/"/g, '')).join(', ');
        return res.status(400).send({ msg: errorMessage });
    }
    try {
        let user = await DB.getAdmin(value.id);

        if (user) {
            return res.status(409).send({ msg: '같은 아이디의 유저가 이미 존재합니다.' });
        } 
    
        user = await DB.createUser(value.id, value.password, false);
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

        // Check if user signed up with google
        if(user.google_login) {
            return res.status(401).send({ msg: '로그인 실패: 이 계정은 구글 로그인을 통해 로그인해야 합니다.' });
        }

        // 비밀번호 비교
        const passwordMatch = await bcrypt.compare(value.password, user.password);

        if (!passwordMatch) {
            return res.status(401).send({ msg: '로그인 실패: 아이디 또는 비밀번호를 다시 확인해주세요.' });
        }

        // 인증 성공 시 초기 점수 및 액세스 토큰 생성 및 전송
        const accessToken = uuidv4();
        setAuthCookie(res, accessToken);
        await DB.setAdminToken(value.id, accessToken);

        return res.status(200).send({ eventList: eventList, access_token: accessToken, id: value.id });
    } catch (err) {
        console.error('로그인 중 오류:', err);
        return res.status(500).send({ msg: '서버 오류: 로그인을 처리하는 도중에 문제가 발생했습니다.' });
    }
});

// DeleteAuth token if stored in cookie
apiRouter.delete('/auth/logout/:id', async (req, res) => {
    const authToken = req.cookies[authCookieName];
    const { id } = req.params;
    try {
        const user = await DB.getAdmin(id);
        const tokenRemoved = await DB.deleteUserToken(authToken);
        if (tokenRemoved || user.google_login) {
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
// Google Auth
apiRouter.post('/google-auth', async (req, res) => {
    let { access_token } = req.body;
  
    getAuth()
        .verifyIdToken(access_token)
        .then(async (decodedUser) => {
            let { email } = decodedUser;

            // Check if user exists
            let user = await DB.getAdmin(email);

            if (user) {
            // Check if user signed up with google
                if (!user.google_login) {
                    return res.status(403).json({
                    error:
                        'This email was signed up without google auth. Please log in with password to access the account',
                    });
                }
            } else {
                // Create user if not exists
                user = await DB.createUser(email, 'no_password', true);
            }

            // Initial Setting for the event page
            const eventList = await DB.getEventList(email);
            // Set the cookie
            setAuthCookie(res, access_token);

            return res.status(200).send({ eventList: eventList, access_token: access_token, id: email });
        })
        .catch((err) => {
            return res.status(500).json({
                error:
                'Failed to authenticate you with google. Try with some other Google account',
            });
        });
});


apiRouter.get('/get-scores/:id', async (req, res) => {
    const { id } = req.params;
    const { eventName } = req.query;

    try {
        const scores = await DB.initialScores(eventName, id);
        authToken = await req.cookies[authCookieName];
        authToken = authToken ? authToken : null;
        userID = userID ? userID : null;
        res.status(200).send({ scores: scores, access_token: authToken, id: userID })
    }
    catch {
        res.status(400).end();
    }
})

apiRouter.get('/get-public-data/:id', async (req, res) => {
    const { id } = req.params;
    const { eventName } = req.query;
    
    try {
        const scores = await DB.getEventScores(eventName, id);
        return res.status(200).send({ eventName: eventName, scores: scores, id: id });
    } catch (error) {
        console.error('Error fetching event data:', error);
        return res.status(400).end();
    }
});

// secureApiRouter verifies credentials for endpoints
var secureApiRouter = express.Router();
apiRouter.use(secureApiRouter);

secureApiRouter.use(async (req, res, next) => {
    authToken = req.cookies[authCookieName];
    if (authToken) {
        next();
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
    });

secureApiRouter.get('/get-activityList/:id', async (req, res) => {
    const { id } = req.params;
    const { eventName } = req.query;
    
    try {
        const activities = await DB.getActivityList(eventName, id);
        res.status(200).send(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).send({ msg: 'Failed to fetch activities' });
    }
});

secureApiRouter.post('/insert-team/:id', async (req, res) => {
    const { id } = req.params;
    const { eventName } = req.query;

    const { error } = teamNameSchema.validate(req.body.teamName);
    if (error) {
        return res.status(500).send('유효한 팀 이름을 입력해주세요.');
    }

    try {
        authToken = req.cookies[authCookieName];
        const scores = await DB.insertTeam(req.body, eventName, id);
        return res.status(200).send({eventName: eventName, scores: scores , access_token: authToken , id: id});
    } catch(err) {
        return res.status(400).send('유효한 팀 이름을 입력해주세요.');
    }
});

secureApiRouter.delete('/delete-team/:teamName', async (req, res) => {
    const { teamName } = req.params;
    const { eventName, id } = req.query;
    console.log(teamName, eventName, id)

    try {
        const scores = await DB.deleteTeam(teamName, eventName, id);
        authToken = req.cookies[authCookieName];
        return res.status(200).send({eventName: eventName, scores: scores , access_token: authToken , id: id});
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred while trying to delete the document');
    }
});

secureApiRouter.get('/get-eventList/:id', async (req, res) => {
    const { id } = req.params;

    try {
        authToken = req.cookies[authCookieName];
        const eventList = await DB.getEventList(id);
        return res.status(200).send({eventList: eventList, access_token: authToken , id: id});
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred while trying to delete the document');
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
        console.log(req.body.id);
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
        return res.status(200).send({ eventName: eventName, scores: scores, access_token: authToken, id: id });
    } catch (error) {
        console.error('Error fetching event data:', error);
        return res.status(400).end();
    }
});

secureApiRouter.delete('/delete-multiple-teams/:id', async (req, res) => {
    const teamNames = req.body;
    const { id } = req.params;
    const { eventName } = req.query;
    try{
        const scores = await DB.deleteMultipleTeams(teamNames, eventName, id);
        authToken = req.cookies[authCookieName];
        return res.status(200).send({eventName: eventName, scores: scores, access_token: authToken , id: id});
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred while trying to delete the document');
    }
})

secureApiRouter.put('/update-score-by-activity', async (req, res) => {
    try {
        const { eventName } = req.query;
        const { activityId, teamName, newScore, id } = req.body;
        const updatedScores = await DB.updateScoresByActivity(activityId, teamName, newScore, eventName, id);
        if (isNaN(newScore) || newScore > 100 || newScore < 0) {
            res.status(500).send({ msg: '0부터 100사이에 있는 숫자를 입력해주세요.' });
        }
        authToken = req.cookies[authCookieName];
        res.status(200).send({updatedScores: updatedScores , access_token: authToken , id: id});
    } catch (err) {
        console.error('Error updating score by activity:', err);
        res.status(500).send({ msg: 'Failed to update score' });
    }
});

secureApiRouter.get('/teams/:id', async (req, res) => {
    const { id } = req.params;
    const { eventName } = req.query;
    try {
        const teams = await DB.getTeamNamesFromScores(eventName, id);
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
secureApiRouter.get('/get-score-and-participation/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { teamName, activityId, eventName } = req.query;

        if (!teamName) {
            return res.status(400).send({ msg: 'Invalid input data' });
        }

        const team = await DB.getTeam(teamName, eventName, id);

        if (!team) {
            return res.status(404).send({ msg: 'Team not found' });
        }

        const score = team.activities[activityId] || 0;
        const participateNum = team.participateNum || 0; // Assuming participateNum is stored at the team level

        res.status(200).send({ score, participateNum });
    } catch (err) {
        console.error('Error fetching score and participation:', err);
        res.status(500).send({ msg: 'Failed to fetch score and participation' });
    }
});

secureApiRouter.delete('/delete-multiple-activities/:id', async (req, res) => {
    const activityNames = req.body;
    const { id } = req.params;
    const { eventName } = req.query;
    try{
        const activityList = await DB.deleteMultipleActivities(activityNames, eventName, id);
        authToken = req.cookies[authCookieName];
        const scores = await DB.getEventScores(eventName, id);
        return res.status(200).send({eventName: eventName, activityList: activityList , scores: scores, access_token: authToken , id: id});
    }catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred while trying to delete the document');
    }
})

secureApiRouter.post('/insert-activity/:id', async (req, res) => {
    const { id } = req.params;
    const { eventName } = req.query;

    const { error } = teamNameSchema.validate(req.body.activityName);
    if (error) {
        return res.status(500).send('유효한 활동 이름을 입력해주세요.');
    }

    try {
        authToken = req.cookies[authCookieName];
        const activityList = await DB.insertActivity(req.body.activityName, eventName, id);
        // const scores = await DB.initialScores();
        const scores = await DB.getEventScores(eventName, id);
        return res.status(200).send({eventName: eventName, access_token: authToken , id: id, scores: scores, activityList: activityList });
    } catch(err) {
        return res.status(400).send(err.message);
    }
});

secureApiRouter.delete('/delete-activity/:activityName', async (req, res) => {
    const { activityName } = req.params;
    const { id, eventName } = req.query;
    try {
        const activityList = await DB.deleteActivity(activityName, eventName, id);
        authToken = req.cookies[authCookieName];
        const scores = await DB.getEventScores(eventName, id);
        res.status(200).send({eventName: eventName, activityList: activityList , scores: scores, access_token: authToken , id: id});
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
      maxAge: 1000 * 60 * 60, // 1 hour
    });
  }
