
module.exports = {
    SORT_FUNC: {
        WIN_RATE: {
            name: "winrate",
            desc: "tỉ lệ thắng",
            aggressive : {
                $cond: [
                    { $eq: [{ $add: ['$win', '$lose'] }, 0] }, // Kiểm tra tổng có bằng 0
                    0, // Nếu tổng = 0, gán winrate 0
                    { $divide: ['$win', { $add: ['$win', '$lose'] }] } // Nếu tổng != 0, tính winrate bình thường
                ]
            }
            ,
            formatFunc: function (rate) {
                return Math.floor(rate * 10000)/100;
            }
        },
        DIFF: {
            name: "diff",
            desc: "hiệu số",
            aggressive : { $subtract: ['$win', '$lose'] }
        }
    }
}