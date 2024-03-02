const functions = require("../utils/functions");

let friendsService = {
    requestFriend: function (requesting_user, requested_user) {
        return new Promise((resolve, reject) => {
            let self = this;

            functions.executeSql( //Verifica se a pessoa já pediu amizade primeiro
                `
                    SELECT
                        id
                    FROM
                        friend_requests
                    WHERE
                        requesting_user = ? AND requested_user = ? AND accepted = 0
                `, [requested_user, requesting_user]
            ).then((results) => {
                if (results.length > 0) {
                    self.acceptFriend(requesting_user, requested_user).then(() => {
                        resolve();
                    }).catch((error) => {
                        reject(error);
                    })
                } else {
                    functions.executeSql( //Verifica se o pedido ja foi enviado pela mesma pessoa, caso sim não faz nada e retorna
                        `
                            SELECT
                                id
                            FROM
                                friend_requests
                            WHERE
                                requesting_user = ? AND requested_user = ? AND accepted = 0
                        `, [requesting_user, requested_user]
                    ).then((results2) => {
                        if (results2.length > 0) {
                            resolve();
                        } else {
                            functions.executeSql(
                                `
                                    INSERT INTO
                                        friend_requests
                                        (create_date, requesting_user, requested_user)
                                    VALUES
                                        (DATE_ADD(CURRENT_TIMESTAMP, interval -3 hour), ?, ?)
                                `, [requesting_user, requested_user]
                            ).then(() => {
                                resolve();
                            }).catch((error) => {
                                reject(error);
                            })
                        }
                    })
                }
            })
        })
    },
    rejectFriendRequest: function (requesting_user, requested_user) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    DELETE FROM
                        friend_requests
                    WHERE
                        requesting_user = ? AND requested_user = ?
                `, [requesting_user, requested_user]
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    acceptFriend: function (user1, user2) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SET @user1 := ?;
                    SET @user2 := ?;

                    UPDATE
                        friend_requests
                    SET
                        accepted = 1
                    WHERE
                        (requesting_user = ${user1} OR requested_user = ${user1}) AND (requesting_user = ${user2} OR requested_user = ${user2})
                `, []
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    acceptFriendRequest: function (requesting_user, requested_user) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    START TRANSACTION;

                    IF (
                        SELECT COUNT(id) 
                        FROM blocked_users 
                        WHERE (blocking_user = ${requesting_user} AND blocked_user = ${requested_user}) OR (blocking_user = ${requested_user} AND blocked_user = ${requesting_user})
                    ) = 0 THEN
                        UPDATE friend_requests
                        SET accepted = 1
                        WHERE requesting_user = ${requesting_user} AND requested_user = ${requested_user} AND accepted = 0;
                    
                        INSERT INTO friends (friend1, friend2)
                        VALUES (${requesting_user}, ${requested_user});
                    END IF;
                    
                    COMMIT;
                `, []
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    unfriend: function (user_id, target_user) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    DELETE FROM
                        friends
                    WHERE
                        (friend1 = ${user_id} OR friend2 = ${user_id}) AND (friend1 = ${target_user} OR friend2 = ${target_user})
                `, []
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    blockUser: function (user_id, target_user_id) {
        return new Promise((resolve, reject) => {
            this.unfriend(user_id, target_user_id).then(() => {
                functions.executeSql(
                    `
                        INSERT INTO
                            blocked_users
                            (blocking_user, blocked_user, block_date)
                        VALUES
                            (?, ?, DATE_ADD(CURRENT_TIMESTAMP, interval -3 hour))
                    `, [user_id, target_user_id]
                ).then(() => {
                    resolve();
                }).catch((error) => {
                    reject(error);
                })
            }).catch((error) => {
                reject(error);
            })
        })
    },
    unblockUser: function (user_id, target_user_id) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    DELETE FROM
                        blocked_users
                    WHERE
                        blocking_user = ? AND blocked_user = ?
                `, [user_id, target_user_id]
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = friendsService;