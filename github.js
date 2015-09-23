#!/usr/bin/env node

// Clear
console.log('\033[2J');

var inquirer = require("inquirer")
optimist = require('optimist')
	, request = require("request")

var argv = optimist.usage('Usage: $0 -h [hostname]')
	.demand('h')
	.alias('h', 'hostname')
	.alias('u', 'username')
	.alias('t', 'token')
	.alias('n', 'teamname')
	.describe('h', 'GHE Hostname')
	.describe('u', 'GHE admin user (overrides ENV GITHUB_USER)')
	.describe('t', 'GHE admin user personal token with admin:org (overrides ENV GITHUB_TOKEN)')
	.describe('n', 'Team name to give push and pull rights. Users will be added to this team when creating a new Organization (defaults to "Employees")')
	.argv

var hostname = argv.h
	, username = argv.u || process.env.GITHUB_USER
	, token = argv.t || process.env.GITHUB_TOKEN
	, teamName = argv.n|| "Employees"
	, github = require("./github-utils")(username, token, hostname)

if (!hostname || !token || !username) {
	optimist.showHelp()
	process.exit(0)
}

// Interactive prompt:
//inquirer.prompt({
//	type: "list",
//	name: "operation",
//	message: "What would you like to do today",
//	choices: ["Create a new organisation. Add all existing users to it.", "Create a user. Add it to all organisations"]
//}, function (answers) {
//	if (answers.operation.indexOf('Create a new organisation') >= 0) {
//		inquirer.prompt([
//			{
//				type: "input",
//				name: "organisationName",
//				message: "What's the login id of the new organisation?"
//			},
//			{
//				type: "input",
//				name: "organisationProfileName",
//				message: "What's the profile name of the new organisation?"
//			}], function (answers) {
//			github.createOrgTeamAndInsertUsers(answers.organisationName, answers.organisationProfileName, teamName)
//		})
//	} else {
//		inquirer.prompt([
//			{
//				type: "input",
//				name: "username",
//				message: "What's the login id of the user? ",
//			},
//			{
//				type: "input",
//				name: "userEmail",
//				message: "What's the email of the user? ",
//			}], function (answers) {
//			github.createUserAddToAllOrgs(answers.username, answers.userEmail, username, teamName)
//		});
//	}
//})

github.createUserAddToAllOrgs("aaab", "aaab@github.com", username, teamName)