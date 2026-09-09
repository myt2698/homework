package com.homework.ledger;

import android.app.Activity;
import android.app.AlertDialog;

/** Shared single-column subject list for ordinary and holiday homework entry. */
final class TaskSubjectPicker {
    private static final String[] SUBJECTS = {"语文", "数学", "英语", "科学"};
    interface Choice { void selected(String subject); }

    static void show(Activity activity, String selected, Choice choice) {
        int checked = 0;
        for (int i = 0; i < SUBJECTS.length; i++) if (SUBJECTS[i].equals(selected)) checked = i;
        new AlertDialog.Builder(activity)
                .setTitle("选择科目")
                .setSingleChoiceItems(SUBJECTS, checked, (dialog, which) -> {
                    dialog.dismiss();
                    choice.selected(SUBJECTS[which]);
                })
                .setNegativeButton("取消", null)
                .show();
    }
}
