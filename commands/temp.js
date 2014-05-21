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

var containers = {};

function run () {
  console.log('Starting Postgres container...');

  var streams = [
    process.stdout,
    process.stderr
  ];

  docker.run('paintedfox/postgresql', [ '/sbin/my_init' ], streams, {
    Tty: false,
    name: 'postgres'
  }, function (err, data, rawContainer) {
    handleError(err);
  }).on('container', function (container) {
    console.log('Postgres started');
    containers.postgres = docker.getContainer(container.id);

    setTimeout(function () {
      console.log('Starting Redis container...');

      docker.run('dockerfile/redis', [ 'redis-server', '/etc/redis/redis.conf' ], streams, {
        name: 'redis'
      }, function (err, data, rawContainer) {
        handleError(err);
      }).on('container', function (container) {
        console.log('Redis started');
        containers.redis = docker.getContainer(container.id);

        setTimeout(function () {
          console.log('Starting Crypton container...');
          docker.run('crypton', [ 'run', '-d' ], streams, {
            HostConfig: {
              Links: [
                'postgres:db',
                'redis:redis'
              ]
            }
          }, function (err, data, rawContainer) {
            handleError(err);
            shutdown();
          }).on('container', function (container) {
            containers.node = docker.getContainer(container.id);
            attach();
          });
        }, 5000); // give redis some time to start

      });

    }, 3000); // give postgres some time to start
  });
}

function handleError (err) {
  if (err) {
    console.log(err);
    shutdown();
  }
}

function attach () {
console.log(containers);
  process.stdin.resume();
  process.on('SIGINT', shutdown);
  process.stdin.on('end', shutdown);
}

function shutdown () {
  console.log('Stopping Crypton container...');
  containers.node.stop(function () {
    console.log('Removing Crypton container...');
    containers.node.remove(function () {
      console.log('Stopping Redis container...');
      containers.redis.stop(function () {
        console.log('Removing Redis container...');
        containers.redis.remove(function () {
          console.log('Stopping Postgres container...');
          containers.postgres.stop(function () {
            console.log('Removing Postgres container...');
            containers.postgres.remove(function () {
              process.exit();
            });
          });
        });
      });
    });
  });
}
