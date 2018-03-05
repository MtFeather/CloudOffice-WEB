#!/bin/bash
# 全部照順序跑!!

env LANG=C /usr/bin/mrtg /srv/cloudoffice/mrtg/mrtg.cfg.cpu
env LANG=C /usr/bin/mrtg /srv/cloudoffice/mrtg/mrtg.cfg.mem
env LANG=C /usr/bin/mrtg /srv/cloudoffice/mrtg/mrtg.cfg.disk
env LANG=C /usr/bin/mrtg /srv/cloudoffice/mrtg/mrtg.cfg.net
