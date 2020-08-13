const triageCirclesRegexp = /:red-c:|:red-circle:|:red_circle:|:bluecir:|:blue_circle:|:large_blue_circle:|:white_circle:/g;

const individualCirclesRegexp = /red|blue|white/;

const findAllDots = /\./g;

const findTriageLabels = /^MAIN-TRIAGE:/;

const findMentions = /\B@([a-z0-9](?:-?[a-z0-9]){0,38})/gi;

exports.regExp = {
  triageCirclesRegexp,
  individualCirclesRegexp,
  findAllDots,
  findTriageLabels,
  findMentions,
};
