const functions = require("../utils/functions");

let notificationsService = {
    getNotifications: function (connected_user) {
        return new Promise((resolve, reject) => {
            let notificationsLength = 0;

            functions.executeSql(
                `
                    SET @connected_user := ?;

                    SELECT
                        "frienship_request" AS type,
                        fr.requesting_user AS user_id,
                        u.nickname AS user_nickname,
                        u.profile_photo AS user_profile_photo,
                        NULL AS id_post,
                        "" AS post_first_words,
                        NULL AS id_comment,
                        DATE_ADD(fr.create_date, interval -3 hour) timestamp,
                        "" AS message
                    FROM
                        friend_requests fr
                    INNER JOIN
                        users u ON u.id = fr.requesting_user
                    WHERE
                        fr.accepted = 0 AND fr.requested_user = @connected_user
                    ORDER BY fr.create_date DESC
                `, [connected_user]
            ).then((results) => {
                notificationsLength += results[1].length;

                let notifications = {
                    length: notificationsLength,
                    objects: results[1]
                }

                resolve(notifications);
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = notificationsService;