# Production systems
This page is mostly intended for DWWW-members, since they have access to the following systems.

## Deploy pipeline

The website is deployed with a pipeline that goes through Jenkins, this is because root does not want an ssh key to the production server on github.
Jenkins can be accessed on [jenkins.dsek.se](https://jenkins.dsek.se), those with access can log in using the same credentials as on [dsek.se](https://dsek.se). When logged in select the view `Dsek Web` and the pipeline `Deploy_web` is the one deploying the website.

### How it works

When [making a release](/guides/releasing), a github action builds and zips the needed files and triggers a Jenkins build. Jenkins fetches the zip file, the pipeline that runs is defined in the `Jenkinsfile`. Jenkins then transfers the zip file to the production server, unzips it and restarts the website.

## Production server

### SSH to the server
`ssh -J <stilid>@hyacinth.blossom.dsek.se <stilid>@web-beta`

or, for a shorter command you can add something like

```
Host hyacinth.blossom.dsek.se
        User <stilid>
        IdentityFile /path/to/identityfile

Host *.blossom
        HostName %h.dsek.se
        ProxyJump hyacinth.blossom.dsek.se
        User <stilid>
        IdentityFile /path/to/identityfile
```
and use `ssh web-beta.blossom`

### Logs

You need to view logs as transferUser, first run `sudo su transferUser`, then you can run `pm2 logs` to view logs live. [More documentation on pm2](https://pm2.keymetrics.io/docs/usage/log-management/)

Older logs are located in `/home/transferUser/.pm2/logs`
