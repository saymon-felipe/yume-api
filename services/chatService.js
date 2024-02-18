const functions = require("../utils/functions");

let chatService = {
    returnUsers: function (user_id) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SELECT
                        u.id,
                        u.nickname,
                        u.profile_photo,
                        u.user_status
                    FROM 
                        users u
                    INNER JOIN
                        friends f ON (f.friend1 = u.id OR f.friend2 = u.id)
                    WHERE
                        (f.friend1 = ? OR f.friend2 = ?)
                        AND u.id != ?
                `, [user_id, user_id, user_id]
            ).then((results) => {
                let friends = {
                    friends: results
                }

                resolve(friends);
            }).catch((error) => {
                reject(error);
            })
        })
    },
    isFriends: function (user1, user2) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SET @user1 := ?;
                    SET @user2 := ?;

                    SELECT
                        id
                    FROM
                        friends
                    WHERE
                        (friend1 = @user1 OR friend2 = @user1) AND (friend1 = @user2 OR friend2 = @user2)
                `, [user1, user2]
            ).then((results) => {
                if (results[2][0] == undefined) {
                    reject("O destinatário não está em sua lista de amigos");
                }
                
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    sendMessage: function (sender_id, receiver_id, sender_name, sender_profile_photo, receiver_name, message) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    INSERT INTO
                        messages
                        (sender_id, receiver_id, sender_name, sender_profile_photo, receiver_name, message, send_date)
                    VALUES
                        (?, ?, ?, ?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, interval -3 hour))
                `, [sender_id, receiver_id, sender_name, sender_profile_photo, receiver_name, message]
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    returnMessages: function (user1, user2) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SET @user1 := ?;
                    SET @user2 := ?;

                    SELECT
                        *
                    FROM
                        messages
                    WHERE
                        (sender_id = @user1 OR receiver_id = @user1) AND (sender_id = @user2 OR receiver_id = @user2)
                `, [user1, user2]
            ).then((results) => {
                let messages = {
                    messages: results[2]
                }

                resolve(messages);
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = chatService;