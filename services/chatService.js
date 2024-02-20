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
                        (f.friend1 = ${user_id} OR f.friend2 = ${user_id})
                        AND u.id != ${user_id}
                `, []
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
                    SELECT
                        id
                    FROM
                        friends
                    WHERE
                        (friend1 = ${user1} OR friend2 = ${user1}) AND (friend1 = ${user2} OR friend2 = ${user2})
                `, []
            ).then((results) => {
                if (results[0].id == undefined) {
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
    returnMessages: function (sender, receiver) {
        return new Promise((resolve, reject) => {
            let self = this;

            functions.executeSql(
                `
                    SELECT
                        *
                    FROM
                        messages
                    WHERE
                        (sender_id = ${sender} OR receiver_id = ${sender}) AND (sender_id = ${receiver} OR receiver_id = ${receiver})
                `, []
            ).then((results) => {
                self.viewMessages(receiver, sender).then(() => {
                    let messages = {
                        messages: results
                    }
    
                    resolve(messages);
                }).catch((error) => {
                    reject(error);
                })
            }).catch((error) => {
                reject(error);
            })
        })
    },
    viewMessages: function (sender, receiver) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    UPDATE
                        messages
                    SET
                        view_date = DATE_ADD(CURRENT_TIMESTAMP, interval -3 hour)
                    WHERE
                        sender_id = ? AND receiver_id = ?
                `, [sender, receiver]
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    checkNewMessages: function(sender, receiver) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SELECT
                        COUNT(id) AS new_messages
                    FROM
                        messages
                    WHERE
                        view_date = "" AND sender_id = ? AND receiver_id = ?
                `, [sender, receiver]
            ).then((results) => {
                let data = {
                    have_new_messages: false
                }
    
                if (results[0].new_messages > 0) {
                    data.have_new_messages = true;
                }
    
                resolve(data);
            }).catch((error) => {
                reject(error);
            })
        })
    },
    checkViewedMessages: function(sender, receiver) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SELECT
                        COUNT(id) AS not_viewed_messages
                    FROM
                        messages
                    WHERE
                        view_date = "" AND sender_id = ? AND receiver_id = ?
                `, [sender, receiver]
            ).then((results) => {
                let data = {
                    viewed_messages: false
                }
    
                if (results[0].not_viewed_messages == 0) {
                    data.viewed_messages = true;
                }
    
                resolve(data);
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = chatService;