const triage_circles_regexp = /:red-c:|:red-circle:|:red_circle:|:bluecir:|:blue_circle:|:large_blue_circle:|:white_circle:/g;

const individual_circles_regexp = /red|blue|white/;

const find_all_dots = /\./g;

const find_all_underscores = /_/g;

const find_triage_labels = /^MAIN-TRIAGE:/;

const find_mentions = /\B@([a-z0-9](?:-?[a-z0-9]){0,38})/gi;

exports.reg_exp = {
  triage_circles_regexp,
  individual_circles_regexp,
  find_all_dots,
  find_all_underscores,
  find_triage_labels,
  find_mentions,
};
