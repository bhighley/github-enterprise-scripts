module.exports = function (username, token, hostname) {

  console.log("Settings")
  console.log("----------------")
  console.log("User:" + username)
  console.log("Hostname:" + hostname)
  console.log("Token:" + token)
  console.log("----------------")

  var Octokat = require('octokat'),
    baseURL = "https://" + username + ":" + token + "@" + hostname + "/api/v3",
    octo = new Octokat({
      username: username,
      password: token,
      rootURL: 'https://' + hostname + '/api/v3'
    })

  var createUserAddToAllOrgs = function (username, email, owner, teamName) {

    createOrRetrieveUser(username, email, function (err, userId) {

      if (err) logAndExit("Error creating or retrieving user " + username, err)

      octo.me.orgs.fetch(function (err, organisations) {

        if (err) logAndExit("Error fetching organisations for user " + owner, err)

        organisations.forEach(function (organisation) {

          octo.orgs(organisation.login).teams.fetch(function (err, teams) {

            if (err) {
              logAndExit("Error fetching teams for organisation " + organisation, err)
            }

            var teamId
            for (var i = 0; i < teams.length; i++) {

              if (teams[i].name == teamName) {
                teamId = teams[i].id
                break;
              }
            }

            if (!teamId) {
              console.log("Organisation " + organisation.login + " doesn't have a team " + teamName)
            } else {
              addUserToTeam(username, teamId, function (err) {
                if (err) {
                  logAndExit("Problem adding " + username + " to " + teamName, err)
                } else {
                  console.log("Added " + username + " to " + teamName + " in " + organisation.login)
                }
              })
            }
          })
        })
      })
    })
  }


  var createOrRetrieveUser = function (username, email, callback) {

    console.log("Checking for user:" + username)

    octo.users(username).fetch(function (err, data) {

      if (err) {
        console.log("User " + username + " doesn't exist")

        createUser(username, email, function (err, res, body) {
          if (err) {
            callback(err)
          } else {
            console.log("User " + username + " created with ID " + body.id)
            callback(null, body.id)
          }
        })
      } else {
        console.log(username + " already exists with ID" + data.id)
        callback(null, data.id)
      }
    })
  }

  var createUser = function (username, email, callback) {

    var options = {
      method: 'post',
      body: {
        "login": username,
        "email": email
      },
      json: true,
      url: baseURL + "/admin/users"
    }

    request(options, callback)

  }

  var addUserToTeam = function (username, teamId, callback) {

    var options = {
      method: 'put',
      json: true,
      url: baseURL + "/teams/" + teamId + "/members/" + username
    }

    request(options, callback)
  }

  var getAllUsers = function (lastIdRead, resultSet, callback) {

    octo.users.fetch({since: lastIdRead}, function (err, users) {

      if (err) {
        callback(err)
        return
      }

      if (!users || users.length == 0) {

        callback(null, resultSet)

      } else {

        var lastUserId = users[users.length - 1].id
        getAllUsers(lastUserId, resultSet.concat(users), callback)
      }

    })
  }


  var getAll = function (fn, lastIdRead, resultSet, callback) {

    fn({since: lastIdRead}, function (err, result) {

      if (err) {
        callback(err)
        return
      }

      if (!result || result.length == 0) {

        callback(null, resultSet)

      } else {

        var lastId = result[result.length - 1].id
        getAll(fn, lastId, resultSet.concat(result), callback)
      }

    })
  }

  var createOrgTeamAndInsertUsers = function (orgUsername, orgProfileName, teamName) {

    createOrRetrieveOrg(orgUsername, orgProfileName, function (err) {

      if (err) logAndExit("Error creating or retrieving organisation " + orgUsername, err)

      createOrRetrieveTeamId(orgUsername, teamName, function (err, teamId) {

        if (err) logAndExit("Error creating or retrieving team " + teamName, err)

        getAll(octo.users.fetch, 0, [], function (err, users) {

          if (err) {
            console.error("Error retrieving all users:" + err)
          } else {
            users.forEach(function (user) {

              addUserToTeam(user.login, teamId, function (err, callback) {
                if (err) {
                  logAndExit("Error adding user " + user.login + " to team " + teamName, err)
                } else {
                  console.log("Added user " + user.login + " to team " + teamName)
                }
              })

            })
          }
        })

      })
    })
  }

  var createOrRetrieveTeamId = function (neworgname, teamName, callback) {

    octo.orgs(neworgname).teams.fetch(function (err, teams) {

      if (err) {
        callback(err)
      } else {

        var teamId
        for (var i = 0; i < teams.length; i++) {

          if (teams[i].name == teamName) {
            console.log("Team " + teamName + " already exists with ID " + teams[i].id)
            callback(null, teams[i].id)
            return;
          }
        }

        octo.orgs(neworgname).teams.create({name: teamName, permission: 'push'}, function (err, data) {

          if (err) {
            callback(err)
          } else {
            console.log("Team " + teamName + " created with ID " + data.id)
            callback(null, data.id)
          }
        })
      }
    })
  }

  var createOrRetrieveOrg = function (orgUsername, orgProfileName, callback) {

    octo.orgs(orgUsername).fetch(function (err, data) {

      if (err && err.status == 404) {
        createOrg(orgUsername, orgProfileName, function (err, res, body) {
          if (!err) {
            console.log("Organisation with id " + orgUsername + " created")
            callback(null)
          } else {
            callback(err)
          }
        })
      } else if (data && data.id) {
        console.log("Organisation with id " + orgUsername + " already exists")
        callback(null)
      } else {
        callback(err)
      }
    })
  }

  var createOrg = function (neworgname, neworgprofilename, callback) {

    var options = {
      method: 'post',
      body: {
        "login": neworgname,
        "admin": username,
        "profile_name": neworgprofilename
      },
      json: true,
      url: baseURL + "/admin/organizations"
    }

    request(options, callback)
  }

  var logAndExit = function (message, err) {
    console.error(message + ":" + err)
    process.exit(0)
  }

  return {
    createUserAddToAllOrgs: createUserAddToAllOrgs,
    createOrgTeamAndInsertUsers: createOrgTeamAndInsertUsers
  }

}