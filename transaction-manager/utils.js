function convertJSDateToMySQL(date)
{
    return date.toISOString().slice(0, 19).replace('T', ' ');
}
exports.convertJSDateToMySQL = convertJSDateToMySQL;function parseArgs(info)
{
    return `'${convertJSDateToMySQL(info.time_queued)}' '${info.region}' '${info.status}' ${info.version}`;
}
exports.parseArgs = parseArgs;

