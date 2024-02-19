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
                        (requesting_user = @user1 OR requested_user = @user1) AND (requesting_user = @user2 OR requested_user = @user2)
                `, [user1, user2]
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = friendsService;