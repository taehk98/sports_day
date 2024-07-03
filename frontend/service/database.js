const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const config = require('./dbConfig.json');
const bcrypt = require('bcrypt');
const uuid = require('uuid');

// connecting mongodb
const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('fsy');

const scoresCollection = db.collection('scores');
const userCollection = db.collection('admin');
const activityListCollection = db.collection('activityList');

(async function testConnection() {
    await client.connect();
    await db.command({ ping: 1 });
  })().catch((ex) => {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
  });

async function initialScores() {
    try {
        const allDocuments = await scoresCollection.find({}).toArray();
        // 업데이트된 attendances를 외부로 반환
        scores = allDocuments;
        return scores;
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

async function getTeam(teamName) {
    return await scoresCollection.findOne({ teamName: teamName });
}

async function insertTeam(team) {
    try {
        // 팀 이름 중복 확인
        const existingTeam = await scoresCollection.findOne({ teamName: team.teamName });
        if (existingTeam) {
            throw new Error('팀 이름이 이미 존재합니다.');
        }
        await scoresCollection.insertOne(team);
        return await initialScores();
    } catch (err) {
        console.error('Failed to add the team', err);
        return;
    }
}

async function deleteTeam(teamID) {
    try {
      const result = await scoresCollection.deleteOne({ _id: new ObjectId(teamID) });
      // 재시도 로직 추가
      if (result.deletedCount === 0) {
        // console.warn(`Document not found on first try for _id: ${teamID}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        result = await scoresCollection.deleteOne({ _id: new ObjectId(teamID) });
    }

    if (result.deletedCount === 0) {
        console.error(`해당 조를 찾지 못했습니다: ${teamID}`);
        throw new Error(`해당 조를 찾지 못했습니다: ${teamID}`);
    }
      return await initialScores();
    } catch (error) {
        throw new Error('팀들 삭제에 실패했습니다.');
    }
}

async function deleteMultipleTeams(teamIDs) {
    try {
        for (let i = 0; i < teamIDs.length; i++) {
            let objectId;
            try {
                objectId = new ObjectId(teamIDs[i]);
            } catch (error) {
                console.error(`Invalid ObjectId: ${teamIDs[i]} - ${error.message}`);
                throw new Error(`Invalid ObjectId: ${teamIDs[i]}`);
            }

            const result = await scoresCollection.deleteOne({ _id: objectId });
             // 재시도 로직 추가
             if (result.deletedCount === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
                result = await scoresCollection.deleteOne({ _id: objectId });
            }

            if (result.deletedCount === 0) {
                console.error(`해당 조를 찾지 못했습니다: ${teamIDs[i]}`);
                throw new Error(`해당 조를 찾지 못했습니다: ${teamIDs[i]}`);
            }
        }
        return await initialScores();
    } catch (error) {
        console.error(`팀들 삭제에 실패했습니다: ${error.message}`);
        throw new Error('팀들 삭제에 실패했습니다.');
    }
}

async function updateSnack(req, res, snackData, teamName) {
    try {
        // Ensure snackData is an array
        if (!Array.isArray(snackData)) {
            return res.status(400).json({ error: 'snackData는 배열이어야 합니다.' });
        }
        console.log(snackData);
        console.log(teamName);
        const result = await scoresCollection.updateOne(
            { teamName: teamName },
            { $set: { snack: snackData } }
        );

        if (result.matchedCount === 0) {
            throw new Error(`업데이트에 실패했습니다.`);
        } else {
            return { message: '간식이 업데이트되었습니다.' };
        }
    } catch (err) {
        console.error(err);
        return { error: '서버 오류가 발생했습니다.' };
    }
}

async function insertActivity(activityName) {
    try {
        const updateResult = await scoresCollection.updateMany(
            {},
            {
                $set: { [`activities.${activityName}`]: 0}
            }
        )
        console.log('Update Result:', updateResult);
        console.log(`Matched ${updateResult.matchedCount} documents and modified ${updateResult.modifiedCount} documents.`);
        const insertResult = await activityListCollection.updateOne(
            { _id: new ObjectId("6655327c3b77c61b1646dab2") },
            {
              $push: {
                activities: activityName
              }
            }
        );
        return await getActivityList();
    } catch (error) {
        console.error('Error updating documents:', error);
    }
}

async function getActivityList() {
    try {
        const activities = await activityListCollection.find({}).toArray();
        // console.log(activities)
        return activities;
    } catch (error) {
        console.error('Error fetching activity list:', error);
        throw error;
    }
}

async function deleteActivity(activityName) {
    try {
        const escapedActivityName = activityName.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        let result = await scoresCollection.updateMany(
            { "activities": { $exists: true } }, // Ensure activities field exists
            { $unset: { [`activities.${escapedActivityName}`]: "" } }
        );

        if (result.modifiedCount === 0) {
            console.log("here");
            throw new Error(`activities 필드를 못찾았습니다: ${activityName}`);
        }

        result = await activityListCollection.updateOne(
            { _id: new ObjectId("6655327c3b77c61b1646dab2") },
            {
                $pull: {
                    activities: activityName
                }
            }
        );
        if (result.modifiedCount === 0) {
            console.log("here");
            throw new Error(`activities 필드를 못찾았습니다: ${activityName}`);
        }
      return await getActivityList();
    } catch (error) {
        throw new Error('활동 삭제에 실패했습니다.');
    }
}

async function deleteMultipleActivities(activityNames) {
    try {
        for (let i = 0; i < activityNames.length; i++) {
            
            let result = await scoresCollection.updateMany(
                { "activities": { $exists: true } }, // Ensure activities field exists
                { $unset: { [`activities.${activityNames[i]}`]: "" } }
            );

            if (result.modifiedCount === 0) {
                throw new Error(`activities 필드를 못찾았습니다: ${activityNames[i]}`);
            }

            result = await activityListCollection.updateOne(
                { _id: new ObjectId("6655327c3b77c61b1646dab2") },
                {
                    $pull: {
                        activities: activityNames[i]
                    }
                }
            );
            if (result.modifiedCount === 0) {
                throw new Error(`activities 필드를 못찾았습니다: ${activityNames[i]}`);
            }
        }
      return await getActivityList();
    } catch (error) {
        throw new Error('활동 삭제에 실패했습니다.');
    }
  }

async function updateScoresByActivity(activityId, teamName, newScore) {
    try {
        const team = await scoresCollection.findOne({ teamName: teamName });
        if (!team) {
            throw new Error('Team not found');
        }

        // Update the activity score
        team.activities[activityId] = Number(newScore);
        team.totalScore = 0;
        team.participateNum = 0;
        // console.log(team.activities)
        for(const activity in team.activities) {
            if(team.activities[activity] !== 0){
                team.participateNum += 1;
            }
            team.totalScore += Number(team.activities[activity]);
        }

        // Update the document in the database
        await scoresCollection.updateOne(
            { teamName: teamName },
            { $set: { activities: team.activities, totalScore: team.totalScore, participateNum:team.participateNum }, }
        );

        // Return the updated scores
        return await initialScores();
    } catch (err) {
        console.error('Failed to update scores by activity:', err);
        throw err;
    }
}

async function getTeamNamesFromScores() {
    try {
        const teamNames = await scoresCollection.distinct('teamName');
        // console.log(teamNames);
        return teamNames.map(teamName => ({ teamName })); // Adjust the format if needed
    } catch (error) {
        console.error('Error fetching team names from scores:', error);
        throw error;
    }
}

async function getActivities() {
    try {
        const activities = await activityListCollection.distinct('activities');
        // console.log(activities);
        return activities.map(activity => ({ activity })); // Adjust the format if needed
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
    updateSnack
};