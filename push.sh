YML="manifest.yml"

SPACE="dev"

ORGANIZATION="janmejaydas9@gmail.com"

bx target -s $SPACE -o $ORGANIZATION
bx app push -f $YML