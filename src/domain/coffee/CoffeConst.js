
module.exports = {
    SORT_FUNC: {
        WIN_RATE: {
            name: "winrate",
            desc: "tỉ lệ thắng",
            match: {
                $or: [
                    {win: {$gt: 0}},
                    {lose: {$gt: 0}},
                ]
            },
            aggressive: { $divide: ['$win', { $add: ['$win', '$lose'] }] },
            formatFunc: function (rate) {
                return Math.floor(rate * 10000)/100 + "%";
            }
        },
        DIFF: {
            name: "diff",
            desc: "hiệu số",
            aggressive : { $subtract: ['$win', '$lose'] },
            formatFunc: function (diff) {
                return diff + " ly"
            }
        }
    }
}