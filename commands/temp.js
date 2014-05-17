/* Crypton CLI, Copyright 2014 SpiderOak, Inc.
 *
 * This file is part of Crypton CLI.
 *
 * Crypton CLI is free software: you can redistribute it and/or modify it
 * under the terms of the Affero GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * Crypton CLI is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public
 * License for more details.
 *
 * You should have received a copy of the Affero GNU General Public License
 * along with Crypton CLI.  If not, see <http://www.gnu.org/licenses/>.
*/
'use strict';

var program = process.program;
var Docker = require('dockerode');
var utils = require('../lib/utils');

var docker = new Docker({
  //socketPath: '/var/run/docker.sock'
  host: 'http://localhost',
  port: '4243'
});

program.command('temp')
  .description('Run a one-off instance of a Crypton backend')
  .action(run);

function run () {
  // TODO check for docker
  // TODO check for spideroak/crypton image

  console.log('Starting Docker container...');

  docker.run('crypton', ['start'], [ process.stdout, process.stderr ], function (err, data, rawContainer) {
    if (err) {
      console.log(err);
      process.exit();
    }

    container = docker.getContainer(rawContainer.id);
    attach();
  });
}

function attach () {
  process.stdin.resume();
  process.on('SIGINT', shutdown);
  process.stdin.on('end', shutdown);
}

function shutdown () {
  console.log('Stopping container...');
  container.stop(function () {
    console.log('Removing container...');
    container.remove(function () {
      process.exit();
    });
  });
}
