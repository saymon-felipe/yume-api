const functions = require("../utils/functions");

let notificationsService = {
    viewNotifications: function (connected_user) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    UPDATE 
                        users
                    SET
                        last_notification_seen_date = DATE_ADD(CURRENT_TIMESTAMP(), interval -3 hour)
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
                        NULL AS more_text
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
                        more_text
                    FROM (
                        SELECT
                            'like' AS type,
                            l.liker_user AS user_id,
                            u.nickname AS user_nickname,
                            u.profile_photo AS user_profile_photo,
                            l.post_id AS id_post,
                            CONCAT(LEFT(p.post_text, 15), "...") AS post_first_words,
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
                            END AS more_text
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
                    ) AS likeSubQuery

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
                        more_text
                    FROM (
                        SELECT
                            'comment' AS type,
                            pc.creator_id AS user_id,
                            u.nickname AS user_nickname,
                            u.profile_photo AS user_profile_photo,
                            pc.post_id AS id_post,
                            CONCAT(LEFT(p.post_text, 15), "...") AS post_first_words,
                            pc.id AS id_comment,
                            DATE_ADD(pc.create_date, interval -3 hour) AS timestamp,
                            CONCAT(LEFT(pc.comment, 15), "...") AS message,
                            CASE 
                                WHEN COUNT(pc.creator_id) - 1 > 0 THEN
                                    CASE 
                                        WHEN COUNT(pc.creator_id) - 1 = 1 THEN CONCAT('e mais uma pessoa comentaram') 
                                        ELSE CONCAT('e mais ', COUNT(pc.creator_id) - 1, ' pessoas comentaram') 
                                    END
                                ELSE "comentou"
                            END AS more_text
                        FROM
                            post_comments pc
                        INNER JOIN
                            users u ON u.id = pc.creator_id
                        INNER JOIN
                            posts p ON p.id = pc.post_id
                        WHERE
                            p.creator_id = ${connected_user} -- Você pode adicionar mais condições aqui, se necessário
                        AND
                            pc.creator_id <> ${connected_user}
                            AND pc.create_date > (SELECT last_notification_seen_date FROM users WHERE id = ${connected_user}) -- Adicione esta condição para notificações de curtidas após a última visualização
                        GROUP BY
                            pc.post_id -- Aqui estamos agrupando por post_id
                    ) AS commentSubQuery

                    UNION

                    SELECT
                        'sharing' AS type,
                        p.creator_id AS user_id,
                        u.nickname AS user_nickname,
                        u.profile_photo AS user_profile_photo,
                        p_criador.id AS id_post,
                        CONCAT(LEFT(p_criador.post_text, 15), "...") AS post_first_words,
                        NULL AS id_comment,
                        DATE_ADD(p.create_date, interval -3 hour) AS timestamp,
                        NULL AS message,
                        CASE 
                            WHEN COUNT(p.creator_id) - 1 > 0 THEN
                                CASE 
                                    WHEN COUNT(p.creator_id) - 1 = 1 THEN CONCAT('e mais uma pessoa compartilharam') 
                                    ELSE CONCAT('e mais ', COUNT(p.creator_id) - 1, ' pessoas compartilharam') 
                                END
                            ELSE "compartilhou"
                        END AS more_text
                    FROM
                        posts p
                    INNER JOIN
                        users u ON u.id = p.creator_id
                    INNER JOIN 
                        posts p_criador ON p_criador.creator_id = ${connected_user}
                    WHERE
                        p.creator_id <> ${connected_user} -- Você pode adicionar mais condições aqui, se necessário
                    AND
                        p_criador.id = p.reference_post_id
                        AND p.create_date > (SELECT last_notification_seen_date FROM users WHERE id = ${connected_user}) -- Adicione esta condição para notificações de curtidas após a última visualização
                    GROUP BY
                        p.reference_post_id

                    ORDER BY
                        timestamp DESC
                `, []
            ).then((results) => {        
                let notifications = {
                    length: results.filter(result => result.type != null).length,
                    objects: results.filter(result => result.type != null)
                }

                resolve(notifications);
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = notificationsService;