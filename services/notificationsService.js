const functions = require("../utils/functions");

let notificationsService = {
    viewNotifications: function (connected_user) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    UPDATE 
                        users
                    SET
                        last_notification_seen_date = CURRENT_TIMESTAMP()
                    WHERE
                        id = ${connected_user};
                `, []
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    getNotifications: function (connected_user) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SELECT
                        "frienship_request" AS type,
                        fr.requesting_user AS user_id,
                        u.nickname AS user_nickname,
                        u.profile_photo AS user_profile_photo,
                        NULL AS id_post,
                        "" AS post_first_words,
                        NULL AS id_comment,
                        DATE_ADD(fr.create_date, interval -3 hour) timestamp,
                        "" AS message,
                        NULL AS more_likes
                    FROM
                        friend_requests fr
                    INNER JOIN
                        users u ON u.id = fr.requesting_user
                    WHERE
                        fr.accepted = 0 AND fr.requested_user = ${connected_user}

                    UNION

                    SELECT
                        type,
                        user_id,
                        user_nickname,
                        user_profile_photo,
                        id_post,
                        post_first_words,
                        id_comment,
                        MAX(timestamp) AS timestamp,
                        message,
                        more_likes
                    FROM (
                        SELECT
                            'like' AS type,
                            l.liker_user AS user_id,
                            u.nickname AS user_nickname,
                            u.profile_photo AS user_profile_photo,
                            l.post_id AS id_post,
                            LEFT(p.post_text, 15) AS post_first_words,
                            NULL AS id_comment,
                            DATE_ADD(l.create_date, interval -3 hour) AS timestamp,
                            '' AS message,
                            CASE 
                                WHEN COUNT(l.liker_user) - 1 > 0 THEN
                                    CASE 
                                        WHEN COUNT(l.liker_user) - 1 = 1 THEN CONCAT('e mais uma pessoa curtiram') 
                                        ELSE CONCAT('e mais ', COUNT(l.liker_user) - 1, ' pessoas curtiram') 
                                    END
                                ELSE "curtiu"
                            END AS more_likes
                        FROM
                            post_likes l
                        INNER JOIN
                            users u ON u.id = l.liker_user
                        INNER JOIN
                            posts p ON p.id = l.post_id
                        WHERE
                            p.creator_id = ${connected_user} -- Você pode adicionar mais condições aqui, se necessário
                        AND
                            l.liker_user <> ${connected_user}
                            AND l.create_date > (SELECT last_notification_seen_date FROM users WHERE id = ${connected_user}) -- Adicione esta condição para notificações de curtidas após a última visualização
                        GROUP BY
                            l.post_id -- Aqui estamos agrupando por post_id
                    ) AS subquery
                    ORDER BY
                        timestamp DESC
                `, []
            ).then((results) => {
                let notificationsLength = results[0].type != null ? results.length : 0;
                
                let notifications = {
                    length: notificationsLength,
                    objects: results[0].type != null ? results : []
                }

                resolve(notifications);
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = notificationsService;