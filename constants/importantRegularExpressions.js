// TODO optimize this regex
const triage_circles_regexp = /:red-c:|:red-circle:|:red_circle:|:bluecir:|:blue_circle:|:large_blue_circle:|:white_circle:/g;

const individual_circles_regexp = /red|blue|white/;

module.exports = {triage_circles_regexp, individual_circles_regexp};
