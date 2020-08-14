const {getUserIdByGithubUsername, addReviewRequest} = require('../../models');
const {asyncArrayMap, sendMentionMessage} = require('../../helper-functions');

async function pullRequestReviewRequested(app, req, res) {
  const {
    // repository: {full_name: repo_path},
    sender: {login: requestorLogin},
    pullRequest,
    installation: {id: installationId},
  } = req;

  const {
    requested_reviewers: requestedReviewers,
    title,
    body,
    htmlUrl,
    user: pullRequestCreator,
    createdAt,
  } = pullRequest;

  const contentCreateDate = new Date(createdAt);

  const requestedReviewerCallback = async requestedReviewer => {
    const githubUsername = requestedReviewer.login;

    const mentionedSlackUser = await getUserIdByGithubUsername(
      githubUsername,
      installationId
    );

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
