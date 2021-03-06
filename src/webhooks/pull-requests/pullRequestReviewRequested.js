const {getUserIdByGithubUsername, addReviewRequest} = require('../../models');
const {asyncArrayMap, sendMentionMessage} = require('../../helper-functions');

async function pullRequestReviewRequested(req, res, app) {
  const {
    // repository: {full_name: repo_path},
    sender: {login: requestorLogin},
    pull_request: pullRequest,
    installation: {id: installationId},
  } = req;

  const {
    requested_reviewers: requestedReviewers,
    title,
    body,
    html_url: htmlUrl,
    user: pullRequestCreator,
    createdAt,
  } = pullRequest;

  const contentCreateDate = new Date(createdAt);

  const requestedReviewerCallback = async requestedReviewer => {
    const githubUsername = requestedReviewer.login;

    const mentionedSlackUser = await getUserIdByGithubUsername(githubUsername);

    // Message the team members whose review was requested
    const mentionEventData = {
      title,
      body,
      requestorLogin,
      htmlUrl,
      contentCreator: pullRequestCreator.login,
      avatarUrl: pullRequestCreator.avatar_url,
      contentCreateDate,
      mentionedSlackUser: `@${mentionedSlackUser}`,
      reviewRequested: true,
      installationId,
    };

    if (mentionedSlackUser) {
      try {
        await addReviewRequest(mentionEventData, installationId);

        await sendMentionMessage(app, mentionEventData);
      } catch (error) {
        console.error(error);
      }
    }

    res.send();
  };

  await asyncArrayMap(requestedReviewers, requestedReviewerCallback);
}

exports.pullRequestReviewRequested = pullRequestReviewRequested;
