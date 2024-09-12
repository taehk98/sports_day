const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const config = require('./dbConfig.json');
const bcrypt = require('bcrypt');
const uuid = require('uuid');

// connecting mongodb
const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('sportsday');

const scoresCollection = db.collection('scores');
const userCollection = db.collection('users');
const activityListCollection = db.collection('activityLists');
const eventListCollection = db.collection('eventLists');

(async function testConnection() {
    await client.connect();
    await db.command({ ping: 1 });
  })().catch((ex) => {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
  });

  async function initialScores(eventName, id) {
    try {
        const document = await scoresCollection.findOne(
            { id: id, 'events.eventName': eventName },
            { projection: { events: { $elemMatch: { eventName: eventName } } } }
        );

        let targetEvent = null;
        if (document && document.events && document.events.length > 0) {
            targetEvent = document.events[0];
        }

        return targetEvent;
    } catch (err) {
        console.error('Failed to fetch documents from the collection:', err);
        return;
    }
}

async function setAdminToken(id, token) {
    try{
        const insertResult = await userCollection.updateOne(
            { id: id },
            {
              $push: {
                token: token
              }
            }
        );
    }catch (error) {
        console.error('유저 데이터 업데이트 오류:', error);
    }
    
}

async function createUser(id, password, google_login) {
    let user = {}
    if(google_login){
        user = {
            // for google login user id is email
            id: id,
            password: "",
            google_login: true,
            token: [],
        };
    }else {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = {
            id: id,
            password: hashedPassword,
            google_login: false,
            token: [],
        };
    }
    
    const events = {
        id: id,
        events: []
    }

    const scores = {
        id: id,
        events: []
    }
    const activityList = {
        id: id,
        events: []
    }
    try {
        const newUser = await userCollection.insertOne(user);
        const newEvent = await eventListCollection.insertOne(events);
        const newScores = await scoresCollection.insertOne(scores);
        const newActivityList = await activityListCollection.insertOne(activityList);
        return newUser;
    } catch (err) {
        console.error('사용자 생성 중 오류:', err);
        throw new Error('사용자를 생성하는 도중 오류가 발생했습니다.');
    }
}

async function getUser(email) {
    return await userCollection.findOne({ email: email });
  }
  
async function getUserByToken(tokenID) {
    // return await userCollection.findOne({ token: token });
    return await userCollection.findOne({ token: tokenID  })
}

async function deleteUserToken(tokenID) {
    try {
        const result = await userCollection.updateOne(
            { "token": tokenID }, // 조건: token 배열에 tokenID가 있는 문서
            { $pull: { token: tokenID } } // $pull 연산자를 사용하여 token 배열에서 tokenID와 일치하는 요소를 제거
        );

        if (result.matchedCount === 0) {
            console.log('No documents matched the query. tokenID:', tokenID);
        } else if (result.modifiedCount === 0) {
            console.log('The token was not found in the array. tokenID:', tokenID);
        } else {
            console.log('Token removed successfully. tokenID:', tokenID);
        }

        const updatedUser = await userCollection.findOne({ token: tokenID  })
        if (updatedUser) {
            console.log('Token still exists in the user document. tokenID:', tokenID);
            return false; // 토큰이 여전히 존재하면 false 반환
        } else {
            console.log('Token confirmed removed. tokenID:', tokenID);
            return true; // 토큰이 제거되었으므로 true 반환
        }
    } catch (error) {
        console.error('Error removing token:', error);
        throw error;
    }
}

async function getAdmin(userId) {
    return await userCollection.findOne({ id: userId });
}

async function getEventList(userId) {
    return await eventListCollection.findOne({ id: userId });
}

async function getTeam(teamName, eventName, id) {
    try {
        const document = await scoresCollection.findOne({
            id: id,
            'events': {
                $elemMatch: {
                    eventName: eventName
                }
            }
        });

        if (!document) {
            throw new Error('해당 id, eventName를 가진 문서를 찾을 수 없습니다.');
        }

        // events 배열에서 eventName이 일치하는 요소 찾기
        const event = document.events.find(event => event.eventName === eventName);

        if (!event) {
            throw new Error('해당 eventName을 가진 이벤트를 찾을 수 없습니다.');
        }

        const team = event.teams.find(existingTeam => existingTeam.teamName === teamName) 

        if (!team) {
            throw new Error('해당 팀을 찾을 수 없습니다.');
        }
        return team;
    }
    catch (err) {
        console.error('팀 찾기에 실패했습니다.', err);
        return;
    }
}

async function insertTeam(team, eventName, id) {
    try {
        // id, eventName, teamName으로 문서 찾기
        const document = await scoresCollection.findOne({
            id: id,
            'events': {
                $elemMatch: {
                    eventName: eventName
                }
            }
        });

        if (!document) {
            throw new Error('해당 id, eventName를 가진 문서를 찾을 수 없습니다.');
        }

        // events 배열에서 eventName이 일치하는 요소 찾기
        const event = document.events.find(event => event.eventName === eventName);

        if (!event) {
            throw new Error('해당 eventName을 가진 이벤트를 찾을 수 없습니다.');
        }

        // teamName 중복 확인
        if (event.teams.some(existingTeam => existingTeam.teamName === team.teamName)) {
            throw new Error('팀 이름이 이미 존재합니다.');
        }

        // team 추가
        event.teams.push(team);

        // 업데이트된 문서 저장
        await scoresCollection.updateOne(
            { id: id, 'events.eventName': eventName },
            { $set: { 'events.$.teams': event.teams } }
        );

        return await getEventScores(eventName, id); // 초기화된 스코어 반환
    } catch (err) {
        console.error('팀 추가에 실패했습니다.', err);
        return;
    }
}

async function deleteTeam(teamName, eventName, id) {
    try {
        let result = await scoresCollection.updateOne(
            { id: id, 'events.eventName': eventName },
            { $pull: { 'events.$.teams': { teamName: teamName } } }
        );
      // 재시도 로직 추가
      if (result.modifiedCount === 0) {
        // console.warn(`Document not found on first try for _id: ${teamID}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        result = await scoresCollection.updateOne(
            { id: id, 'events.eventName': eventName },
            { $pull: { 'events.$.teams': { teamName: teamName } } }
        );
    }

    if (result.modifiedCount === 0) {
        console.error(`해당 조를 찾지 못했습니다: ${teamID}`);
        throw new Error(`해당 조를 찾지 못했습니다: ${teamID}`);
    }
        return await getEventScores(eventName, id);
    } catch (error) {
        throw new Error('팀 삭제에 실패했습니다.');
    }
}

async function deleteEvent(eventName, id) {
    try {
        let result = await eventListCollection.updateOne(
            { id: id },
            { $pull: { events: { eventName: eventName } } }
        );
        // 재시도 로직 추가
        if (result.modifiedCount === 0) {
        // console.warn(`Document not found on first try for _id: ${teamID}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
            result = await eventListCollection.updateOne(
                { id: id },
                { $pull: { events: { eventName: eventName } } }
            );
        }       
        if (result.modifiedCount === 0) {
            console.error(`해당 행사를 삭제하지 못했습니다: ${eventName}`);
            throw new Error(`해당 행사를 삭제하지 못했습니다: ${eventName}`);
        }

        result = await activityListCollection.updateOne(
            { id: id },
            { $pull: { events: { eventName: eventName } } }
        );

        if (result.modifiedCount === 0) {
            console.error(`해당 행사를 삭제하지 못했습니다: ${eventName}`);
            throw new Error(`해당 행사를 삭제하지 못했습니다: ${eventName}`);
        }
        
        result = await scoresCollection.updateOne(
            { id: id },
            { $pull: { events: { eventName: eventName } } }
        );

        if (result.modifiedCount === 0) {
            console.error(`해당 행사를 삭제하지 못했습니다: ${eventName}`);
            throw new Error(`해당 행사를 삭제하지 못했습니다: ${eventName}`);
        }

        return await getEventList(id);
    } catch (error) {
        throw new Error('행사 삭제에 실패했습니다.');
    }
}

async function insertEvent(event, id) {
    console.log(id);
    try {
        // 팀 이름 중복 확인
        const eventList = await eventListCollection.findOne({ id: id });
        if (eventList.events && eventList.events.includes(event.eventName)) {
            throw new Error('팀 이름이 이미 존재합니다.');
        }
        await eventListCollection.updateOne(
            { id: id },
            { $push: { events: event } }
        );
        const newEventScore = {
            id: id,
            eventName: event.eventName,
            teams: []
        }
        const scores = await scoresCollection.updateOne(
            { id: id },
            { $push: { events: newEventScore } }
        );
        const newActivityList = {
            id: id,
            eventName: event.eventName,
            activities: []
        }
        const activityList = await activityListCollection.updateOne(
            { id: id },
            { $push: { events: newActivityList } }
        );

        return await getEventList(id);
    } catch (err) {
        console.error('Failed to add the team', err);
        return;
    }
}

async function getEventScores(eventName, id) {
    try {
        const document = await scoresCollection.findOne(
            { id: id, 'events.eventName': eventName },
            { projection: { 'events.$': 1 } }
        );

        if (!document || !document.events || document.events.length === 0) {
            throw new Error('해당 이벤트를 찾을 수 없습니다.');
        }

        const event = document.events[0];

        if (!event.teams) {
            throw new Error('해당 이벤트의 팀 정보가 없습니다.');
        }

        return event.teams;
    } catch (err) {
        console.error('Failed to fetch teams for the event:', err);
        return null;
    }
}


async function deleteMultipleTeams(teamNames, eventName, id) {
    try {
        for (let i = 0; i < teamNames.length; i++) {
            const result = await scoresCollection.updateOne(
                { id: id, 'events.eventName': eventName },
                { $pull: { 'events.$.teams': { teamName: teamNames[i] } } }
            );
             // 재시도 로직 추가
             if (result.modifiedCount === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
                const result = await scoresCollection.updateOne(
                    { id: id, 'events.eventName': eventName },
                    { $pull: { 'events.$.teams': { teamName: teamNames[i] } } }
                );
            }

            if (result.modifiedCount === 0) {
                console.error(`해당 팀을 찾지 못했습니다: ${teamNames[i]}`);
                throw new Error(`해당 팀을 찾지 못했습니다: ${teamNames[i]}`);
            }
        }
        return await getEventScores(eventName, id);
    } catch (error) {
        console.error(`팀들 삭제에 실패했습니다: ${error.message}`);
        throw new Error('팀들 삭제에 실패했습니다.');
    }
}

async function insertActivity(activityName, eventName, id) {
    try {
        const updateResult = await scoresCollection.updateMany(
            { id: id, "events.eventName": eventName },
            {
                $set: { [`events.$[event].teams.$[].activities.${activityName}`]: 0 }
            },
            {
                arrayFilters: [{ "event.eventName": eventName }]
            }
        )
        console.log('Update Result:', updateResult);
        console.log(`Matched ${updateResult.matchedCount} documents and modified ${updateResult.modifiedCount} documents.`);
        const insertResult = await activityListCollection.updateOne(
            { id: id, 'events.eventName': eventName },
            {
                $push: {
                    "events.$.activities": activityName
                }
            }
        );
        return await getActivityList(eventName, id);
    } catch (error) {
        console.error('Error updating documents:', error);
    }
}

async function getActivityList(eventName, id) {
    try {
        const event = await activityListCollection.findOne(
            { id: id, events: { $elemMatch: { eventName: eventName } } },
            { projection: { 'events.$': 1 } } // events 배열에서 조건에 맞는 첫 번째 요소만 반환
          );

        return event.events[0].activities; // Adjust the format if needed
    } catch (error) {
        console.error('Error fetching activity list:', error);
        throw error;
    }
}

async function deleteActivity(activityName, eventName, id) {
    try {
        let result = await scoresCollection.updateMany(
            { id: id, 'events.eventName': eventName, "events.teams.activities": { $exists: true } },
            { $unset: { [`events.$[].teams.$[].activities.${activityName}`]: "" } }
        );

        if (result.modifiedCount === 0) {
            throw new Error(`activities 필드를 못찾았습니다: ${activityName}`);
        }

        result = await activityListCollection.updateOne(
            { id: id, 'events.eventName': eventName },
            {
                $pull: {
                    "events.$.activities": activityName
                }
            }
        );
        if (result.modifiedCount === 0) {
            throw new Error(`activities 필드를 못찾았습니다: ${activityName}`);
        }
        // update totalscore and participateNum for each team in the event when an activity is deleted
        result = await scoresCollection.findOne(
            { id: id, 'events.eventName': eventName },
            { projection: { 'events.$': 1 } }
        );

        if (!result || result.events.length === 0) {
            throw new Error(`No matching documents found for eventName: ${eventName} and id: ${id}`);
        }

        let teams = result.events[0].teams || []; // Ensure teamNames array exists

        // Update the activity score
        for (let i = 0; i < teams.length; i++) {
            teams[i].totalScore = 0;
            teams[i].participateNum = 0;
            for(const activity in teams[i].activities) {
                if(teams[i].activities[activity] !== 0){
                    teams[i].participateNum += 1;
                }
                teams[i].totalScore += Number(teams[i].activities[activity]);
            }
        }
        result = await scoresCollection.updateOne(
            { id: id, 'events.eventName': eventName },
            {
                $set: {
                    'events.$.teams': teams
                }
            }
        );

      return await getActivityList(eventName, id);
    } catch (error) {
        throw new Error('활동 삭제에 실패했습니다.');
    }
}

async function deleteMultipleActivities(activityNames, eventName, id) {
    try {
        for (let i = 0; i < activityNames.length; i++) {
            
            let result = await scoresCollection.updateMany(
                { id: id, 'events.eventName': eventName, "events.teams.activities": { $exists: true } },
                { $unset: { [`events.$[].teams.$[].activities.${activityNames[i]}`]: "" } }
            );

            if (result.modifiedCount === 0) {
                throw new Error(`activities 필드를 못찾았습니다: ${activityNames[i]}`);
            }

            result = await activityListCollection.updateOne(
                { id: id, 'events.eventName': eventName },
                {
                    $pull: {
                        "events.$.activities": activityNames[i]
                    }
                }
            );
            if (result.modifiedCount === 0) {
                throw new Error(`activities 필드를 못찾았습니다: ${activityNames[i]}`);
            }
        }
        return await getActivityList(eventName, id);
    } catch (error) {
        throw new Error('활동 삭제에 실패했습니다.');
    }
  }

async function updateScoresByActivity(activityId, teamName, newScore, eventName, id) {
    try {
        const result = await scoresCollection.findOne(
            { id: id, 'events.eventName': eventName },
            { projection: { 'events.$': 1 } }
        );

        if (result.length === 0) {
            throw new Error(`No matching documents found for eventName: ${eventName} and id: ${id}`);
        }

        const teams = result.events[0].teams || []; // Ensure teamNames array exists
        const team = teams.find(team => team.teamName === teamName);

        // Update the activity score
        team.activities[activityId] = Number(newScore);
        team.totalScore = 0;
        team.participateNum = 0;
        for(const activity in team.activities) {
            if(team.activities[activity] !== 0){
                team.participateNum += 1;
            }
            team.totalScore += Number(team.activities[activity]);
        }
        // Update the document in the database
        await scoresCollection.updateOne(
            { id: id, 'events.eventName': eventName, 'events.teams.teamName': teamName },
            {
                $set: {
                    'events.$[event].teams.$[team].activities': team.activities,
                    'events.$[event].teams.$[team].totalScore': team.totalScore,
                    'events.$[event].teams.$[team].participateNum': team.participateNum
                }
            },
            {
                arrayFilters: [
                    { 'event.eventName': eventName },
                    { 'team.teamName': teamName }
                ]
            }
        );

        // Return the updated scores
        return await getEventScores(eventName, id);
    } catch (err) {
        console.error('Failed to update scores by activity:', err);
        throw err;
    }
}

async function getTeamNamesFromScores(eventName, id) {
    try {
        const result = await scoresCollection.findOne(
            { id: id, 'events.eventName': eventName },
            { projection: { 'events.$': 1 } }
        );

        if (result.length === 0) {
            throw new Error(`No matching documents found for eventName: ${eventName} and id: ${id}`);
        }

        const teams = result.events[0].teams || []; // Ensure teamNames array exists
        const teamNames = teams.map(team => team.teamName);
        return teamNames;
    } catch (error) {
        console.error('Error fetching team names from scores:', error);
        throw error;
    }
}

async function getActivities(eventName, id) {
    try {
        const event = await activityListCollection.findOne(
            { id: id, events: { $elemMatch: { eventName: eventName } } },
            { projection: { 'events.$': 1 } } // events 배열에서 조건에 맞는 첫 번째 요소만 반환
          );
          
        return event.activities.map(activity => ({ activity })); // Adjust the format if needed
    } catch (error) {
        console.error('Error fetching team names from scores:', error);
        throw error;
    }
}
async function getNumActsFromScores() {
    try {
        const participateNum = await scoresCollection.distinct('participateNum');
        return participateNum.map(participateNum => ({ participateNum })); // Adjust the format if needed
    } catch (error) {
        console.error('Error fetching team names from scores:', error);
        throw error;
    }
}

module.exports = {
    getEventList,
    deleteEvent,
    createUser,
    getUser,
    getUserByToken,
    getTeam,
    setAdminToken,
    getActivityList,
    getTeamNamesFromScores,
    getActivities,
    getNumActsFromScores,
    initialScores,
    insertTeam,
    updateScoresByActivity,
    getAdmin,
    deleteTeam,
    deleteMultipleTeams,
    insertActivity,
    deleteActivity,
    deleteMultipleActivities,
    deleteUserToken,
    insertEvent,
    getEventScores
};