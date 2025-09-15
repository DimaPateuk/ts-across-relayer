cd ~/ts-across-relayer

pwd

git pull


# systemctl stop ts-across-relayer

# rm /lib/systemd/system/ts-across-relayer.service

cp ./ts-across-relayer.service /lib/systemd/system/ts-across-relayer.service

cat /lib/systemd/system/ts-across-relayer.service

systemctl daemon-reload

systemctl enable ts-across-relayer

echo "-------------"
