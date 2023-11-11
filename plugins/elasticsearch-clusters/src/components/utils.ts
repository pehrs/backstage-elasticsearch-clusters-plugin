export function fmtNum(num: number, digits: number): string {
    var units = ['k', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y'],
        decimal;

    for (var i = units.length - 1; i >= 0; i--) {
        decimal = Math.pow(1000, i + 1);

        if (num <= -decimal || num >= decimal) {
            return +(num / decimal).toFixed(digits) + " " + units[i];
        }
    }
    return "" + num.toFixed(digits)
}

export function fmtBytes(num: number, digits: number): string {
    var si_units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'],
        decimal;

    for (var i = si_units.length - 1; i >= 0; i--) {
        decimal = Math.pow(1000, i + 1);

        if (num <= -decimal || num >= decimal) {
            return +(num / decimal).toFixed(digits) + " " + si_units[i] + "B";
        }
    }
    return "" + num + " B"
}

export function formatNumber(value) {
    return Math.round(value).toLocaleString().replace(/,/g, " ")
}
