const functions = require("../utils/functions");

let postsService = {
    makePost: function (user_id, post_text, post_image) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    INSERT INTO
                        posts
                        (creator_id, post_text, post_image, create_date)
                    VALUES
                        (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP(), interval -3 hour))
                `, [user_id, post_text, post_image]
            ).then((results) => {
                let post = {
                    id: results.insertId,
                    post_text: post_text,
                    post_image: post_image
                }
                
                resolve(post);
            }).catch((error) => {
                reject(error);
            })
        })
    },
    returnFeed: function (user_id, offset, limite, friends = false) {
        return new Promise((resolve, reject) => {
            let friendsQuery = `
                    JOIN
                friends f ON (p.creator_id = f.friend1 AND f.friend2 = ${user_id}) OR (p.creator_id = f.friend2 AND f.friend1 = ${user_id})
            `

            functions.executeSql(
                `
                    CREATE TEMPORARY TABLE tmp_subquery AS
                        SELECT
                            p.id,
                            p.create_date,
                            p.post_image,
                            p.post_text,
                            p.creator_id AS user_id,
                            p.reference_post_profile_photo,
                            p.reference_post_nickname,
                            p.reference_post_create_date,
                            p.reference_post_text,
                            p.reference_post_image,
                            p.reference_post_id,
                            p.reference_post_user_id,
                            u.profile_photo,
                            u.nickname,
                            pm.views AS post_views,
                            pm.engagement AS post_engagement
                        FROM
                            posts p
                        LEFT JOIN
                            users u ON p.creator_id = u.id
                        LEFT JOIN
                            post_metadata pm ON p.id = pm.post_id

                        ${ friends ? friendsQuery : "" }

                        GROUP BY
                            p.id
                        
                        LIMIT ? OFFSET ?;

                        -- Inserção na tabela post_metadata com base nos resultados da subconsulta
                        INSERT INTO post_metadata (post_id, views, engagement)
                        SELECT
                            id,
                            1 AS views,
                            0 AS engagement
                        FROM
                            tmp_subquery
                        ON DUPLICATE KEY UPDATE
                            views = views + 1;

                        SELECT
                            ts.*,
                            (SELECT COUNT(id) FROM post_likes pl WHERE pl.post_id = ts.id) AS likes,
                            (SELECT COUNT(id) FROM post_comments pm WHERE pm.post_id = ts.id) AS comments,
                            (SELECT COUNT(id) FROM posts where reference_post_id = ts.id) AS sharings,
                            CASE WHEN EXISTS (SELECT 1 FROM post_likes WHERE post_id = ts.id AND liker_user = ?) THEN 1 ELSE 0 END AS user_liked
                        FROM
                            tmp_subquery ts
                        ORDER BY
                            -- Ordena primeiro os posts mais relevantes (mais engajamento em menos tempo)
                            (ts.post_engagement / TIMESTAMPDIFF(SECOND, ts.create_date, NOW())) DESC,
                            -- Em seguida, os mais relevantes em termos de visualizações
                            (ts.post_views / TIMESTAMPDIFF(SECOND, ts.create_date, NOW())) DESC,
                            -- Em seguida, os mais recentes
                            ts.create_date DESC,
                            -- Por fim, os mais antigos com menos visualizações
                            ts.create_date ASC,
                            ts.post_views ASC;

                        -- Remoção da tabela temporária após o uso
                        DROP TEMPORARY TABLE IF EXISTS tmp_subquery;
                `, [parseInt(limite), parseInt(offset), user_id]
            ).then((results) => {
                resolve(results[2]);
            }).catch((error) => {
                reject(error);
            })
        })
    },
    returnPost: function (post_id, user_id) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    CREATE TEMPORARY TABLE tmp_subquery AS
                        SELECT
                            p.id,
                            p.create_date,
                            p.post_image,
                            p.post_text,
                            p.creator_id AS user_id,
                            u.profile_photo,
                            u.nickname
                        FROM
                            posts p
                        LEFT JOIN
                            users u ON p.creator_id = u.id
                        WHERE
                            p.id = ?;
                        
                        INSERT INTO post_metadata (post_id, views, engagement)
                        SELECT
                            id,
                            1 AS views,
                            0 AS engagement
                        FROM
                            tmp_subquery
                        ON DUPLICATE KEY UPDATE
                            views = views + 1;
                        
                        SELECT
                            ts.*,
                            (SELECT COUNT(id) FROM post_likes pl WHERE pl.post_id = ts.id) AS likes,
                            (SELECT COUNT(id) FROM post_comments pm WHERE pm.post_id = ts.id) AS comments,
                            (SELECT COUNT(id) FROM posts where reference_post_id = ts.id) AS sharings,
                            CASE WHEN EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = ts.id AND pl.liker_user = ?) THEN 1 ELSE 0 END AS user_liked
                        FROM
                            tmp_subquery ts;
                        
                        DROP TEMPORARY TABLE IF EXISTS tmp_subquery;
                `, [post_id, user_id]
            ).then((results) => {
                resolve(results[2][0]);
            }).catch((error) => {
                reject(error);
            })
        })
    },
    likePost: function (user_id, post_id) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    INSERT INTO post_likes (post_id, liker_user, create_date)
                    SELECT * FROM (SELECT ${post_id}, ${user_id}, DATE_ADD(CURRENT_TIMESTAMP(), interval -3 hour)) AS tmp
                    WHERE NOT EXISTS (
                        SELECT 1 FROM post_likes WHERE post_id = ${post_id} AND liker_user = ${user_id}
                    ) LIMIT 1;

                    UPDATE post_metadata
                    SET engagement = engagement + 1
                    WHERE post_id = ${post_id};
                `, []
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    sharePost: function (user_id, post_id, profile_photo, nickname, create_date, text, post_image, new_text, reference_user_id) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    INSERT INTO
                        posts
                        (creator_id, create_date, reference_post_id, reference_post_profile_photo, reference_post_nickname, reference_post_create_date, reference_post_text, reference_post_image, post_text, reference_post_user_id)
                    VALUES
                        (?, DATE_ADD(CURRENT_TIMESTAMP(), interval -3 hour), ?, ?, ?, ?, ?, ?, ?, ?);

                    UPDATE post_metadata
                    SET engagement = engagement + 1
                    WHERE post_id = ${post_id};
                `, [user_id, post_id, profile_photo, nickname, create_date, text, post_image, new_text, reference_user_id]
            ).then((results) => {
                let post = {
                    id: results.insertId,
                    post_text: new_text,
                    reference_post_image: post_image,
                    reference_post_profile_photo: profile_photo,
                    reference_post_nickname: nickname,
                    reference_post_create_date: create_date,
                    reference_post_text: text,
                    reference_post_user_id: reference_user_id
                }

                resolve(post);
            }).catch((error) => {
                reject(error);
            })
        })
    },
    commentInPost: function (user_id, post_id, comment) {
        return new Promise((resolve, reject) => {
            if (comment.length >= 2000) {
                reject("Número de caracteres excede o permitido");
            } else {
                functions.executeSql(
                    `
                        INSERT INTO
                            post_comments
                            (post_id, creator_id, create_date, comment)
                        VALUES
                            (?, ?, DATE_ADD(CURRENT_TIMESTAMP(), interval -3 hour), ?);

                        UPDATE post_metadata
                        SET engagement = engagement + 1
                        WHERE post_id = ${post_id};
                    `, [post_id, user_id, comment]
                ).then(() => {
                    resolve();
                }).catch((error) => {
                    reject(error);
                })
            }
        })
    },
    returnPostComments: function (post_id) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SELECT
                        pc.*,
                        u.profile_photo,
                        u.nickname
                    FROM
                        post_comments pc
                    INNER JOIN
                        users u ON pc.creator_id = u.id
                    WHERE
                        post_id = ?
                `, [post_id]
            ).then((results) => {
                resolve(results);
            }).catch((error) => {
                reject(error);
            })
        })
    },
    excludePost: function (post_id, user_id) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    DELETE FROM
                        posts
                    WHERE
                        id = ?
                    AND
                        creator_id = ?
                `, [post_id, user_id]
            ).then((results) => {
                if (results.affectedRows == 0) {
                    reject("Você não tem permissão para excluir este post");
                } else {
                    resolve();
                }
            }).catch((error) => {
                reject(error);
            })
        })
    },
    editPost: function (post_id, user_id, post_text) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    UPDATE
                        posts
                    SET
                        post_text = ?
                    WHERE
                        id = ?
                    AND
                        creator_id = ?;

                    UPDATE post_metadata
                    SET engagement = GREATEST(1, FLOOR(engagement / 2))
                    WHERE post_id = ${post_id};
                `, [post_text, post_id, user_id]
            ).then((results) => {
                if (results.affectedRows == 0) {
                    reject("Você não tem permissão para editar este post");
                } else {
                    resolve();
                }
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = postsService;