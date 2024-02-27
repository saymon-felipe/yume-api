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
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    returnFeed: function (user_id, offset, limite) {
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
                            CASE WHEN EXISTS (SELECT 1 FROM post_likes WHERE post_id = ts.id AND user_id = 4) THEN 1 ELSE 0 END AS user_liked
                        FROM
                            tmp_subquery ts;
                        
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
    likePost: function (user_id, post_id) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    INSERT INTO post_likes (post_id, liker_user)
                    SELECT * FROM (SELECT ${post_id}, ${user_id}) AS tmp
                    WHERE NOT EXISTS (
                        SELECT 1 FROM post_likes WHERE post_id = ${post_id} AND liker_user = ${user_id}
                    ) LIMIT 1;
                `, []
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = postsService;