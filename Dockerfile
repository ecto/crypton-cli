# Crypton CLI, Copyright 2014 SpiderOak, Inc.
#
# This file is part of Crypton CLI.
#
# Crypton CLI is free software: you can redistribute it and/or modify it
# under the terms of the Affero GNU General Public License as published by the
# Free Software Foundation, either version 3 of the License, or (at your
# option) any later version.
#
# Crypton CLI is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public
# License for more details.
#
# You should have received a copy of the Affero GNU General Public License
# along with Crypton CLI.  If not, see <http://www.gnu.org/licenses/>.

from dockerfile/nodejs

# grab the crypton server code
run npm install -g crypton-server

# install supervisord
run apt-get install -y supervisor
run mkdir -p /var/log/supervisor

# configure supervisord
add supervisord.conf /etc/supervisor/conf.d/supervisord.conf

run useradd crypton
expose 1025
cmd [ "/usr/bin/supervisord" ]
