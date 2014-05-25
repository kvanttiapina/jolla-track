/*
    GPLv2 copyright here
*/

#ifdef QT_QML_DEBUG
#include <QtQuick>
#endif

#include <QtQml>

#include <sailfishapp.h>
#include "fileio.h"


int main(int argc, char *argv[])
{
    qmlRegisterType<FileIO, 1>("FileIO", 1, 0, "FileIO");
    return SailfishApp::main(argc, argv);
}

