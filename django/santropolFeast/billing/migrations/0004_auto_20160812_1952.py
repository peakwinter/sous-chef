# -*- coding: utf-8 -*-
# Generated by Django 1.9.8 on 2016-08-12 19:52
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0003_auto_20160810_1957'),
    ]

    operations = [
        migrations.RenameField(
            model_name='billing',
            old_name='generation_date',
            new_name='created_date',
        ),
    ]